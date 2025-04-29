import { useQuery } from "@tanstack/react-query";
import { Project, Category, User } from "@shared/schema";

/**
 * Hook to fetch featured projects
 */
export function useFeaturedProjects(limit?: number) {
  return useQuery({
    queryKey: ['/api/projects/featured', limit],
    queryFn: async () => {
      const url = limit ? `/api/projects/featured?limit=${limit}` : '/api/projects/featured';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch featured projects');
      return response.json();
    }
  });
}

/**
 * Hook to fetch trending projects
 */
export function useTrendingProjects(limit?: number) {
  return useQuery({
    queryKey: ['/api/projects/trending', limit],
    queryFn: async () => {
      const url = limit ? `/api/projects/trending?limit=${limit}` : '/api/projects/trending';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch trending projects');
      return response.json();
    }
  });
}

/**
 * Hook to fetch projects by category
 */
export function useProjectsByCategory(categoryId: number | null) {
  return useQuery({
    queryKey: ['/api/projects/category', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const response = await fetch(`/api/projects/category/${categoryId}`);
      if (!response.ok) throw new Error(`Failed to fetch projects for category ${categoryId}`);
      return response.json();
    },
    enabled: !!categoryId
  });
}

/**
 * Hook to fetch a single project by slug
 */
export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: [`/api/projects/${slug}`],
    queryFn: async () => {
      if (!slug) throw new Error('Project slug is required');
      const response = await fetch(`/api/projects/${slug}`);
      if (!response.ok) throw new Error(`Failed to fetch project ${slug}`);
      return response.json();
    },
    enabled: !!slug
  });
}

/**
 * Hook to fetch project creator
 */
export function useProjectCreator(creatorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/users', creatorId],
    queryFn: async () => {
      if (!creatorId) throw new Error('Creator ID is required');
      const response = await fetch(`/api/users/${creatorId}`);
      if (!response.ok) throw new Error(`Failed to fetch creator ${creatorId}`);
      return response.json();
    },
    enabled: !!creatorId
  });
}

/**
 * Hook to fetch project category
 */
export function useProjectCategory(categoryId: number | undefined) {
  return useQuery({
    queryKey: ['/api/categories', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      const response = await fetch(`/api/categories/${categoryId}`);
      if (!response.ok) throw new Error(`Failed to fetch category ${categoryId}`);
      return response.json();
    },
    enabled: !!categoryId
  });
}

/**
 * Hook to search projects
 */
export function useSearchProjects(searchQuery: string) {
  return useQuery({
    queryKey: ['/api/projects', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === '') return [];
      const response = await fetch(`/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();
      
      // Filter projects on the client side
      // In a real app, this would be done on the server
      return projects.filter((project: Project) => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    },
    enabled: searchQuery.trim() !== ''
  });
}
