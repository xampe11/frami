import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Sets up the cursor glow effect that follows the mouse
 */
export const setupCursorEffect = () => {
  const cursor = document.getElementById('cursorGlow');

  if (!cursor) return;

  // Initial state - hidden
  gsap.set(cursor, { opacity: 0 });

  // Show the cursor when mouse moves
  document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
      x: e.clientX - 150,
      y: e.clientY - 150,
      opacity: 0.6,
      duration: 0.3,
      ease: 'power2.out'
    });
  });

  // Hide cursor when mouse leaves the window
  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, {
      opacity: 0,
      duration: 0.3
    });
  });

  // Enhance hover effect on interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .project-card');
  
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      gsap.to(cursor, {
        scale: 1.2,
        opacity: 0.8,
        backgroundColor: 'rgba(108, 74, 255, 0.2)',
        duration: 0.3
      });
    });
    
    element.addEventListener('mouseleave', () => {
      gsap.to(cursor, {
        scale: 1,
        opacity: 0.6,
        backgroundColor: 'rgba(108, 74, 255, 0.15)',
        duration: 0.3
      });
    });
  });
};

/**
 * Animates elements as they enter the viewport
 * @param selector - CSS selector for elements to animate
 */
export const setupScrollAnimations = (selector = '.animate-on-scroll') => {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    gsap.fromTo(element, 
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: element as Element,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
};

/**
 * Animate project cards with staggered effect
 * @param selector - CSS selector for project cards
 */
export const animateProjectCards = (selector = '.project-card') => {
  const cards = document.querySelectorAll(selector);
  
  gsap.fromTo(cards,
    { 
      opacity: 0, 
      y: 20 
    },
    { 
      opacity: 1, 
      y: 0, 
      duration: 0.5, 
      stagger: 0.1,
      ease: 'power2.out'
    }
  );
};

/**
 * Adds hover animations to project cards
 * @param card - DOM element to animate
 */
export const setupCardHoverAnimation = (card: HTMLElement) => {
  if (!card) return;
  
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      y: -10,
      boxShadow: '0 20px 30px rgba(0, 0, 0, 0.1)',
      duration: 0.3,
      ease: 'power2.out'
    });
  });
  
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      y: 0,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      duration: 0.3,
      ease: 'power2.out'
    });
  });
};

/**
 * Text reveal animation for headings
 * @param element - DOM element to animate
 */
export const animateTextReveal = (element: HTMLElement) => {
  if (!element) return;
  
  // Split text by lines and words for more advanced animations
  const text = element.textContent || '';
  element.textContent = '';
  
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const lineSpan = document.createElement('span');
    lineSpan.style.display = 'block';
    lineSpan.style.overflow = 'hidden';
    
    const words = line.split(' ');
    
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.textContent = word + (wordIndex < words.length - 1 ? ' ' : '');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.opacity = '0';
      wordSpan.style.transform = 'translateY(20px)';
      
      gsap.to(wordSpan, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: (lineIndex * 0.1) + (wordIndex * 0.05),
        ease: 'power3.out'
      });
      
      lineSpan.appendChild(wordSpan);
    });
    
    element.appendChild(lineSpan);
  });
};

/**
 * Creates a staggered reveal animation for multiple elements
 * @param elements - NodeList of elements to animate
 * @param delayBetween - Delay between each element animation
 */
export const staggeredReveal = (elements: NodeListOf<Element>, delayBetween = 0.1) => {
  gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    { 
      opacity: 1, 
      y: 0, 
      duration: 0.5,
      stagger: delayBetween,
      ease: 'power2.out'
    }
  );
};
