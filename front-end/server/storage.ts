import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  projects, Project, InsertProject,
  projectUpdates, ProjectUpdate, InsertProjectUpdate,
  transactions, Transaction, InsertTransaction
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByIds(ids: number[]): Promise<User[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getFeaturedProjects(limit?: number): Promise<Project[]>;
  getTrendingProjects(limit?: number): Promise<Project[]>;
  getProjectsByCategoryId(categoryId: number): Promise<Project[]>;
  getProjectsByCreatorId(creatorId: number): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;

  // Project updates operations
  getProjectUpdatesByProjectId(projectId: number): Promise<ProjectUpdate[]>;
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;

  // Transaction operations
  getTransactionsByProjectId(projectId: number): Promise<Transaction[]>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, transactionHash?: string): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private projects: Map<number, Project>;
  private projectUpdates: Map<number, ProjectUpdate>;
  private transactions: Map<number, Transaction>;
  
  private userId: number;
  private categoryId: number;
  private projectId: number;
  private updateId: number;
  private transactionId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.projects = new Map();
    this.projectUpdates = new Map();
    this.transactions = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.projectId = 1;
    this.updateId = 1;
    this.transactionId = 1;

    // Seed initial data
    this.seedData();
  }

  // Seed all data
  private seedData() {
    // First seed categories
    this.seedCategories();
    
    // Then seed user
    this.seedDemoUser();
    
    // Finally seed projects using the above
    this.seedSampleProjects();
    
    // Log seeded data for verification
    console.log('🌱 Seeded categories:', this.categories.size);
    console.log('🌱 Seeded users:', this.users.size);
    console.log('🌱 Seeded projects:', this.projects.size);
    console.log('🌱 Featured projects:', Array.from(this.projects.values()).filter(p => p.featured).length);
  }

  // Seed categories
  private seedCategories() {
    const categoriesList = [
      { name: 'Art', icon: 'paintbrush', slug: 'art' },
      { name: 'Technology', icon: 'microchip', slug: 'technology' },
      { name: 'Sustainability', icon: 'leaf', slug: 'sustainability' },
      { name: 'Games', icon: 'gamepad', slug: 'games' },
      { name: 'Film', icon: 'film', slug: 'film' },
      { name: 'Music', icon: 'music', slug: 'music' },
      { name: 'Publishing', icon: 'book', slug: 'publishing' }
    ];

    categoriesList.forEach(cat => {
      const category: Category = {
        id: this.categoryId++,
        name: cat.name,
        icon: cat.icon,
        slug: cat.slug
      };
      this.categories.set(category.id, category);
    });
  }
  
  // Seed a demo user
  private seedDemoUser() {
    const user: User = {
      id: this.userId++,
      username: 'blockchain_creator',
      password: 'password123', // Not used in frontend demo
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      bio: 'Blockchain enthusiast and tech entrepreneur with a passion for decentralized technologies.',
      createdAt: new Date()
    };
    this.users.set(user.id, user);
  }

  // Seed sample projects
  private seedSampleProjects() {
    const demoUser = Array.from(this.users.values())[0];
    if (!demoUser) return;

    // Get category IDs
    const artCategory = Array.from(this.categories.values()).find(cat => cat.slug === 'art');
    const techCategory = Array.from(this.categories.values()).find(cat => cat.slug === 'technology');
    const sustainCategory = Array.from(this.categories.values()).find(cat => cat.slug === 'sustainability');
    const gameCategory = Array.from(this.categories.values()).find(cat => cat.slug === 'games');
    
    if (!artCategory || !techCategory || !sustainCategory || !gameCategory) return;

    // Create featured projects
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    // Featured Project 1: Decentralized Art Marketplace
    const project1: Project = {
      id: this.projectId++,
      title: "Decentralized Art Marketplace",
      description: "A platform for artists to sell their work directly to collectors using NFT technology, eliminating middlemen and ensuring proper attribution and royalties.",
      story: "The art world has long been plagued by issues of forgery, attribution disputes, and unfair compensation to artists. Our decentralized art marketplace leverages blockchain technology to create a transparent, secure platform where artists can sell directly to collectors without intermediaries.\n\nUsing non-fungible tokens (NFTs), each artwork is uniquely identified on the blockchain, establishing provenance and ensuring authenticity.",
      shortDescription: "NFT marketplace for direct artist-collector transactions",
      thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fundingGoal: 100000,
      currentFunding: 67280,
      fundingCurrency: "USD",
      backerCount: 124,
      creatorId: demoUser.id,
      categoryId: artCategory.id,
      slug: "decentralized-art-marketplace",
      featured: true,
      trending: false,
      daysRemaining: 15,
      createdAt: new Date(now.getTime() - 15 * oneDay),
      updatedAt: now
    };
    this.projects.set(project1.id, project1);

    // Featured Project 2: Sustainable Energy Blockchain
    const project2: Project = {
      id: this.projectId++,
      title: "Sustainable Energy Blockchain",
      description: "A decentralized platform that enables communities to invest in and manage local renewable energy projects, with transparent tracking of energy production and distribution.",
      story: "Climate change demands urgent action, and local renewable energy projects represent one of our most promising solutions. However, community energy initiatives often struggle with financing, management, and equitable distribution of benefits.\n\nOur Sustainable Energy Blockchain creates a decentralized platform where communities can pool resources to invest in local renewable energy projects.",
      shortDescription: "Community-owned renewable energy investments on blockchain",
      thumbnailUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fundingGoal: 100000,
      currentFunding: 89750,
      fundingCurrency: "USD",
      backerCount: 208,
      creatorId: demoUser.id,
      categoryId: sustainCategory.id,
      slug: "sustainable-energy-blockchain",
      featured: true,
      trending: false,
      daysRemaining: 7,
      createdAt: new Date(now.getTime() - 23 * oneDay),
      updatedAt: now
    };
    this.projects.set(project2.id, project2);

    // Featured Project 3: Blockchain Identity Verification
    const project3: Project = {
      id: this.projectId++,
      title: "Blockchain Identity Verification",
      description: "A secure, decentralized platform for digital identity verification that puts users in control of their personal data using blockchain technology.",
      story: "Identity theft affects millions of people annually, and centralized identity systems are vulnerable to data breaches. Our blockchain identity verification platform gives users control over their personal information using decentralized identifiers and verifiable credentials.",
      shortDescription: "Self-sovereign identity solution on blockchain",
      thumbnailUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fundingGoal: 75000,
      currentFunding: 41250,
      fundingCurrency: "USD",
      backerCount: 95,
      creatorId: demoUser.id,
      categoryId: techCategory.id,
      slug: "blockchain-identity-verification",
      featured: true,
      trending: true,
      daysRemaining: 21,
      createdAt: new Date(now.getTime() - 9 * oneDay),
      updatedAt: now
    };
    this.projects.set(project3.id, project3);

    // Featured Project 4: Decentralized Gaming Platform
    const project4: Project = {
      id: this.projectId++,
      title: "Decentralized Gaming Platform",
      description: "A blockchain-based gaming platform where players truly own their in-game assets as NFTs and can trade them freely across games and platforms.",
      story: "Traditional gaming platforms lock player-earned assets within closed ecosystems. Our decentralized gaming platform uses blockchain to give players true ownership of their in-game items and achievements as NFTs that can be traded or used across different games.",
      shortDescription: "Gaming platform with true in-game asset ownership",
      thumbnailUrl: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fundingGoal: 200000,
      currentFunding: 120400,
      fundingCurrency: "USD",
      backerCount: 562,
      creatorId: demoUser.id,
      categoryId: gameCategory.id,
      slug: "decentralized-gaming-platform",
      featured: true,
      trending: true,
      daysRemaining: 14,
      createdAt: new Date(now.getTime() - 16 * oneDay),
      updatedAt: now
    };
    this.projects.set(project4.id, project4);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      walletAddress: insertUser.walletAddress || null,
      avatarUrl: insertUser.avatarUrl || null,
      bio: insertUser.bio || null
    };
    this.users.set(id, user);
    return user;
  }

  async getUsersByIds(ids: number[]): Promise<User[]> {
    return ids
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getFeaturedProjects(limit?: number): Promise<Project[]> {
    const featured = Array.from(this.projects.values()).filter(
      project => project.featured
    );
    
    return limit ? featured.slice(0, limit) : featured;
  }

  async getTrendingProjects(limit?: number): Promise<Project[]> {
    const trending = Array.from(this.projects.values()).filter(
      project => project.trending
    );
    
    return limit ? trending.slice(0, limit) : trending;
  }

  async getProjectsByCategoryId(categoryId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.categoryId === categoryId
    );
  }

  async getProjectsByCreatorId(creatorId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.creatorId === String(creatorId)
    );
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(
      project => project.slug === slug
    );
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    
    // Ensure we're using the right property names from the schema
    const project: Project = { 
      ...insertProject, 
      id, 
      currentFunding: 0, 
      backerCount: 0, 
      createdAt: now, 
      updatedAt: now,
      fundingCurrency: insertProject.fundingCurrency || "ETH",
      featured: !!insertProject.featured,
      trending: !!insertProject.trending,
      shortDescription: insertProject.shortDescription || insertProject.description.substring(0, 100)
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Project updates operations
  async getProjectUpdatesByProjectId(projectId: number): Promise<ProjectUpdate[]> {
    return Array.from(this.projectUpdates.values()).filter(
      update => update.projectId === projectId
    );
  }

  async createProjectUpdate(insertUpdate: InsertProjectUpdate): Promise<ProjectUpdate> {
    const id = this.updateId++;
    const now = new Date();
    const update: ProjectUpdate = { ...insertUpdate, id, createdAt: now };
    this.projectUpdates.set(id, update);
    return update;
  }

  // Transaction operations
  async getTransactionsByProjectId(projectId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.projectId === projectId
    );
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.userId === userId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const now = new Date();
    
    // Ensure transactionHash is null instead of undefined when not provided
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      transactionHash: insertTransaction.transactionHash || null
    };
    
    this.transactions.set(id, transaction);
    
    // Update project's current funding and backer count
    const project = this.projects.get(transaction.projectId);
    if (project && transaction.status === 'completed') {
      const updatedProject = {
        ...project,
        currentFunding: project.currentFunding + transaction.amount,
        backerCount: project.backerCount + 1,
        updatedAt: now
      };
      this.projects.set(project.id, updatedProject);
    }
    
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, transactionHash?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { 
      ...transaction, 
      status,
      ...(transactionHash ? { transactionHash } : {})
    };
    
    this.transactions.set(id, updatedTransaction);
    
    // If status changed to completed, update project
    if (status === 'completed' && transaction.status !== 'completed') {
      const project = this.projects.get(transaction.projectId);
      if (project) {
        const updatedProject = {
          ...project,
          currentFunding: project.currentFunding + transaction.amount,
          backerCount: project.backerCount + 1,
          updatedAt: new Date()
        };
        this.projects.set(project.id, updatedProject);
      }
    }
    
    return updatedTransaction;
  }
}

export const storage = new MemStorage();
