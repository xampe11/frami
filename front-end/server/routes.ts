import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertProjectSchema, 
  insertProjectUpdateSchema, 
  insertTransactionSchema 
} from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Wallet routes
  app.post("/api/wallet/connect", async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      // Generate a random balance between 0.5 and 5 ETH
      const randomBalance = (Math.random() * 4.5 + 0.5).toFixed(2);
      
      res.json({
        connected: true,
        address: address,
        balance: `${randomBalance} ETH`
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to connect wallet",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  // Create HTTP server
  const httpServer = createServer(app);

  // User routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Category routes
  app.get("/api/categories", async (_req: Request, res: Response) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    const slug = req.params.slug;
    
    // Check if it's a numeric ID
    if (/^\d+$/.test(slug)) {
      const id = parseInt(slug, 10);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category);
    }
    
    // Handle as slug
    const category = await storage.getCategoryBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
      
      if (existingCategory) {
        return res.status(409).json({ message: "Category with this slug already exists" });
      }
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Project routes
  app.get("/api/projects", async (_req: Request, res: Response) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/featured", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const featuredProjects = await storage.getFeaturedProjects(limit);
    res.json(featuredProjects);
  });

  app.get("/api/projects/trending", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const trendingProjects = await storage.getTrendingProjects(limit);
    res.json(trendingProjects);
  });

  app.get("/api/projects/category/:categoryId", async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const projects = await storage.getProjectsByCategoryId(categoryId);
    res.json(projects);
  });

  app.get("/api/projects/creator/:creatorId", async (req: Request, res: Response) => {
    const creatorId = parseInt(req.params.creatorId);
    if (isNaN(creatorId)) {
      return res.status(400).json({ message: "Invalid creator ID" });
    }
    
    const projects = await storage.getProjectsByCreatorId(creatorId);
    res.json(projects);
  });

  app.get("/api/projects/:slug", async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const project = await storage.getProjectBySlug(slug);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      
      // Check if creator exists
      const creator = await storage.getUser(projectData.creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      // Check if category exists
      const category = await storage.getCategoryById(projectData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if slug is unique
      const existingProject = await storage.getProjectBySlug(projectData.slug);
      if (existingProject) {
        return res.status(409).json({ message: "Project with this slug already exists" });
      }
      
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const updatedProject = await storage.updateProject(id, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Project updates routes
  app.get("/api/projects/:projectId/updates", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const project = await storage.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const updates = await storage.getProjectUpdatesByProjectId(projectId);
    res.json(updates);
  });

  app.post("/api/projects/:projectId/updates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const updateData = insertProjectUpdateSchema.parse({
        ...req.body,
        projectId
      });
      
      const update = await storage.createProjectUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project update" });
    }
  });

  // Transaction routes
  app.get("/api/projects/:projectId/transactions", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const transactions = await storage.getTransactionsByProjectId(projectId);
    res.json(transactions);
  });

  app.get("/api/users/:userId/transactions", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const transactions = await storage.getTransactionsByUserId(userId);
    res.json(transactions);
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(transactionData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(transactionData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const { status, transactionHash } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const transaction = await storage.updateTransactionStatus(id, status, transactionHash);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Seed data routes for development
  if (process.env.NODE_ENV === 'development') {
    // Add a route to reset the database with our predefined samples
    app.post("/api/reset", async (_req: Request, res: Response) => {
      try {
        // Import the MemStorage class without using dynamic import
        const { MemStorage } = require('./storage');
        
        // Create a new instance of MemStorage which will trigger all the seed methods
        const newStorage = new MemStorage();
        
        // Check if the new instance has data
        const categories = await newStorage.getCategories();
        const projects = await newStorage.getProjects();
        const featured = await newStorage.getFeaturedProjects();
        
        console.log('New storage created with: ', {
          categories: categories.length,
          projects: projects.length,
          featured: featured.length
        });
        
        // Replace our global storage with the new instance
        Object.assign(storage, newStorage);
        
        // Verify reset was successful
        const categoriesCount = (await storage.getCategories()).length;
        const projectsCount = (await storage.getProjects()).length;
        const featuredCount = (await storage.getFeaturedProjects()).length;
        
        res.json({
          message: "Database reset successfully with sample blockchain projects",
          stats: {
            categories: categoriesCount,
            projects: projectsCount,
            featuredProjects: featuredCount
          }
        });
      } catch (error) {
        console.error("Reset error:", error);
        res.status(500).json({ 
          message: "Failed to reset database",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    
    // Original seed route
    app.post("/api/seed", async (_req: Request, res: Response) => {
      try {
        // Create a demo user
        const demoUser = await storage.createUser({
          username: "demo_user",
          password: "password123",
          walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          avatarUrl: "https://i.pravatar.cc/150?img=1",
          bio: "Demo user for testing purposes"
        });

        // Get art category
        const categories = await storage.getCategories();
        const artCategory = categories.find(cat => cat.slug === 'art');
        const techCategory = categories.find(cat => cat.slug === 'technology');
        const gameCategory = categories.find(cat => cat.slug === 'games');
        const sustainCategory = categories.find(cat => cat.slug === 'sustainability');
        
        if (!artCategory || !techCategory || !gameCategory || !sustainCategory) {
          return res.status(500).json({ message: "Categories not found" });
        }

        // Create featured projects
        const featuredProject1 = await storage.createProject({
          title: "Decentralized Art Marketplace",
          description: "A platform for artists to sell their work directly to collectors using NFT technology, eliminating middlemen and ensuring proper attribution and royalties.",
          story: "The art world has long been plagued by issues of forgery, attribution disputes, and unfair compensation to artists. Our decentralized art marketplace leverages blockchain technology to create a transparent, secure platform where artists can sell directly to collectors without intermediaries.\n\nUsing non-fungible tokens (NFTs), each artwork is uniquely identified on the blockchain, establishing provenance and ensuring authenticity. Artists will receive fair compensation for their work, with smart contracts automatically distributing royalties on secondary sales.\n\nOur platform will feature both digital and physical artworks, with physical pieces linked to their digital certificates via secure authentication methods. We'll support various mediums and styles, from traditional painting and sculpture to digital art and mixed media.\n\nWith your support, we can revolutionize how art is bought, sold, and authenticated, creating a more equitable ecosystem for artists and collectors alike.",
          thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 100000,
          fundingCurrency: "USD",
          shortDescription: "NFT marketplace for direct artist-collector transactions",
          creatorId: demoUser.id,
          categoryId: artCategory.id,
          slug: "decentralized-art-marketplace",
          featured: true,
          trending: false,
          daysRemaining: 15
        });
        
        await storage.updateProject(featuredProject1.id, {
          currentFunding: 67280,
          backerCount: 124
        });

        const featuredProject2 = await storage.createProject({
          title: "Sustainable Energy Blockchain",
          description: "A decentralized platform that enables communities to invest in and manage local renewable energy projects, with transparent tracking of energy production and distribution.",
          story: "Climate change demands urgent action, and local renewable energy projects represent one of our most promising solutions. However, community energy initiatives often struggle with financing, management, and equitable distribution of benefits.\n\nOur Sustainable Energy Blockchain creates a decentralized platform where communities can pool resources to invest in local renewable energy projects. Using blockchain technology, we enable transparent tracking of energy production and distribution, ensuring all participants receive fair returns on their investments.\n\nSmart contracts automate payments based on energy generation, while tokenization allows fractional ownership of renewable assets, making investment accessible to everyone regardless of financial capacity.\n\nThe platform will initially support solar and wind projects, with plans to expand to other renewable sources. We'll provide tools for communities to plan, fund, and manage their energy initiatives collectively.\n\nWith your support, we can democratize access to renewable energy investment and accelerate the transition to a sustainable energy future.",
          thumbnailUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 100000,
          fundingCurrency: "USD",
          shortDescription: "Community-owned renewable energy investments on blockchain",
          creatorId: demoUser.id,
          categoryId: sustainCategory.id,
          slug: "sustainable-energy-blockchain",
          featured: true,
          trending: false,
          daysRemaining: 7
        });
        
        await storage.updateProject(featuredProject2.id, {
          currentFunding: 89750,
          backerCount: 208
        });

        // Create trending projects
        const trendingProject1 = await storage.createProject({
          title: "VR Education Platform",
          description: "An immersive virtual reality platform that revolutionizes remote learning through blockchain-verified credentials.",
          story: "The COVID-19 pandemic exposed limitations in remote education. Traditional video conferencing lacks engagement, while existing VR solutions fail to provide verifiable credentials.\n\nOur VR Education Platform creates immersive learning environments where students and educators interact naturally in virtual spaces. Blockchain technology verifies course completion, skills acquisition, and credential issuance, creating tamper-proof educational records.\n\nWe're building a platform that supports various learning styles through interactive 3D models, spatial audio, and haptic feedback. Content creators can monetize educational modules, while institutions can offer accredited courses in our virtual classrooms.\n\nInitially focusing on STEM fields where spatial understanding is crucial, we'll expand to liberal arts, vocational training, and professional development. The platform will be compatible with major VR headsets and accessible via desktop for those without VR equipment.\n\nHelp us transform education through immersive experiences and blockchain verification.",
          thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 100000,
          fundingCurrency: "USD",
          shortDescription: "VR learning with blockchain-verified credentials",
          creatorId: demoUser.id,
          categoryId: techCategory.id,
          slug: "vr-education-platform",
          featured: false,
          trending: true,
          daysRemaining: 21
        });
        
        await storage.updateProject(trendingProject1.id, {
          currentFunding: 45300,
          backerCount: 156
        });

        const trendingProject2 = await storage.createProject({
          title: "Blockchain Music Platform",
          description: "A decentralized platform connecting musicians directly with fans, ensuring fair royalty distribution through smart contracts.",
          story: "Musicians have long struggled with unfair compensation models in the music industry. Streaming services pay minimal royalties, while traditional record labels take substantial cuts of artists' earnings.\n\nOur Blockchain Music Platform connects musicians directly with fans, eliminating intermediaries and ensuring fair compensation through smart contracts. Artists upload music to our decentralized platform, retaining ownership rights while gaining access to a global audience.\n\nListeners subscribe or make micropayments for access, with the majority of revenue going directly to creators. Smart contracts automatically distribute funds to all contributors based on predefined agreements, ensuring transparent and equitable compensation.\n\nThe platform will feature discovery algorithms to help listeners find new artists, community curation tools, and options for exclusive content. Artists can also sell limited-edition digital collectibles related to their music.\n\nJoin us in creating a more sustainable music ecosystem where artists receive fair compensation for their creative work.",
          thumbnailUrl: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 100000,
          fundingCurrency: "USD",
          shortDescription: "Direct music platform with fair royalty distribution",
          creatorId: demoUser.id,
          categoryId: techCategory.id,
          slug: "blockchain-music-platform",
          featured: false,
          trending: true,
          daysRemaining: 9
        });
        
        await storage.updateProject(trendingProject2.id, {
          currentFunding: 78500,
          backerCount: 319
        });

        const trendingProject3 = await storage.createProject({
          title: "Smart Agricultural Network",
          description: "IoT sensors and blockchain technology for transparent tracking of sustainable farming practices and supply chain management.",
          story: "Modern agriculture faces challenges of sustainability, transparency, and fair compensation for farmers. Consumers want to know how their food is produced, while farmers struggle to verify their sustainable practices and receive fair prices.\n\nOur Smart Agricultural Network combines IoT sensors with blockchain technology to create a transparent record of farming practices and food supply chains. Sensors monitor soil health, water usage, and growing conditions, recording data to an immutable blockchain ledger.\n\nConsumers can scan product QR codes to view complete production histories, verifying sustainable practices. Smart contracts ensure farmers receive fair compensation based on quality metrics and sustainable certifications.\n\nThe platform supports small farmers by providing affordable sensor technology and connecting them directly with consumers willing to pay premiums for sustainably grown food. We'll initially focus on specialty crops before expanding to broader agricultural products.\n\nHelp us create a more transparent, sustainable food system that rewards responsible farming practices.",
          thumbnailUrl: "https://images.unsplash.com/photo-1606161290889-77950cfb67d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 100000,
          fundingCurrency: "USD",
          shortDescription: "Blockchain-powered sustainable farming verification",
          creatorId: demoUser.id,
          categoryId: sustainCategory.id,
          slug: "smart-agricultural-network",
          featured: false,
          trending: true,
          daysRemaining: 3
        });
        
        await storage.updateProject(trendingProject3.id, {
          currentFunding: 92700,
          backerCount: 243
        });

        const trendingProject4 = await storage.createProject({
          title: "Decentralized Gaming Platform",
          description: "A blockchain-based gaming ecosystem where players truly own their in-game assets and can trade them on an open marketplace.",
          story: "Traditional gaming platforms keep players locked in controlled ecosystems where they have no true ownership of their virtual assets or achievements. Despite spending countless hours and real money acquiring in-game items, players cannot freely trade or monetize these assets outside the game's ecosystem.\n\nOur Decentralized Gaming Platform creates a new paradigm where players have verifiable ownership of their in-game assets through blockchain technology. Using non-fungible tokens (NFTs), each virtual item becomes a unique digital asset that players can truly own, trade, or sell on open marketplaces.\n\nThe platform will support various game genres with interoperable assets that can move between compatible games. Developers can create games on our platform with tools for integrating blockchain assets, while players benefit from true ownership and potential appreciation of their gaming investments.\n\nWe'll launch with several native games while developing an SDK for third-party developers to integrate their existing or new games into our ecosystem.\n\nJoin us in revolutionizing gaming by giving players true ownership and control over their digital assets.",
          thumbnailUrl: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          fundingGoal: 200000,
          fundingCurrency: "USD",
          shortDescription: "Gaming platform with true in-game asset ownership",
          creatorId: demoUser.id,
          categoryId: gameCategory.id,
          slug: "decentralized-gaming-platform",
          featured: false,
          trending: true,
          daysRemaining: 14
        });
        
        await storage.updateProject(trendingProject4.id, {
          currentFunding: 120400,
          backerCount: 562
        });

        // Create a transaction
        await storage.createTransaction({
          userId: demoUser.id,
          projectId: featuredProject1.id,
          amount: 100,
          walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          status: "completed",
          transactionHash: "0x5f7c73c55aae6dd757e6b90af83e98143d5c954ab51c842802196a35a0a950da"
        });

        res.json({ message: "Seed data created successfully" });
      } catch (error) {
        console.error("Seed error:", error);
        res.status(500).json({ message: "Failed to seed data" });
      }
    });
  }

  return httpServer;
}
