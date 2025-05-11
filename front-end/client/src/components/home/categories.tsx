import { useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Category } from '@shared/schema';
import gsap from 'gsap';

const Categories = () => {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  useEffect(() => {
    if (categories) {
      const categoriesSection = document.querySelector('.categories-section');
      
      if (categoriesSection) {
        gsap.from('.category-pill', {
          opacity: 0,
          y: 10,
          stagger: 0.05,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: categoriesSection,
            start: 'top 80%',
          }
        });
      }
    }
  }, [categories]);
  
  return (
    <section className="py-12 bg-white categories-section">
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-heading">Browse by Category</h2>
          <Link href="/discover">
            <a className="text-primary font-medium flex items-center">
              View All 
              <i className="fas fa-arrow-right ml-2 text-sm"></i>
            </a>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 9 }).map((_, index) => (
              <div 
                key={index}
                className="px-6 py-2 bg-gray-100 rounded-full animate-pulse w-24"
              ></div>
            ))
          ) : (
            categories?.map((category) => (
              <Link key={category.id} href={`/discover?category=${category.slug}`}>
                <a className="category-pill">
                  {category.name}
                </a>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
