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

    // Seed initial categories
    this.seedCategories();
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
    const user: User = { ...insertUser, id };
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
      project => project.creatorId === creatorId
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
    const project: Project = { 
      ...insertProject, 
      id, 
      raisedAmount: 0, 
      backers: 0, 
      createdAt: now, 
      updatedAt: now 
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
    const transaction: Transaction = { ...insertTransaction, id, createdAt: now };
    this.transactions.set(id, transaction);
    
    // Update project's raised amount and backers count
    const project = this.projects.get(transaction.projectId);
    if (project && transaction.status === 'completed') {
      const updatedProject = {
        ...project,
        raisedAmount: project.raisedAmount + transaction.amount,
        backers: project.backers + 1,
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
          raisedAmount: project.raisedAmount + transaction.amount,
          backers: project.backers + 1,
          updatedAt: new Date()
        };
        this.projects.set(project.id, updatedProject);
      }
    }
    
    return updatedTransaction;
  }
}

export const storage = new MemStorage();
