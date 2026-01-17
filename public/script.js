// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all scam cards and protection items
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.scam-card, .protection-item, .action-step');
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Add hover effect to scam cards
document.querySelectorAll('.scam-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.zIndex = '10';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.zIndex = '1';
  });
});

// Stats counter animation
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = formatStatNumber(target);
      clearInterval(timer);
    } else {
      element.textContent = formatStatNumber(Math.floor(current));
    }
  }, 16);
}

function formatStatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B+';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(0) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      
      // Animate each stat
      setTimeout(() => animateCounter(statNumbers[0], 10000000000, 2000), 100);
      setTimeout(() => animateCounter(statNumbers[1], 300000000, 2000), 300);
      // Keep "1 in 4" as is - it's text, not a number
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  statsObserver.observe(heroStats);
}

// Add parallax effect to hero background
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroBackground = document.querySelector('.hero-background');
  
  if (heroBackground && scrollY < window.innerHeight) {
    heroBackground.style.transform = `translateY(${scrollY * 0.5}px)`;
    heroBackground.style.opacity = `${1 - scrollY / window.innerHeight}`;
  }
  
  lastScrollY = scrollY;
}, { passive: true });

// Add glow effect on mouse move for hero section
const hero = document.querySelector('.hero');
if (hero) {
  hero.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = hero.getBoundingClientRect();
    
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;
    
    hero.style.setProperty('--mouse-x', `${x * 100}%`);
    hero.style.setProperty('--mouse-y', `${y * 100}%`);
  });
}

// Add click ripple effect to CTA button
document.querySelectorAll('.cta-button').forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    
    ripple.style.position = 'absolute';
    ripple.style.width = ripple.style.height = '100px';
    ripple.style.left = `${e.clientX - rect.left - 50}px`;
    ripple.style.top = `${e.clientY - rect.top - 50}px`;
    ripple.style.background = 'rgba(255,255,255,0.5)';
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    ripple.style.pointerEvents = 'none';
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Keyboard navigation enhancement
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-nav');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-nav');
});

// Performance optimization: Lazy load images if any are added
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback for browsers that don't support lazy loading
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

console.log('🛡️ Anti-Scam Website Loaded Successfully');
console.log('💡 Stay vigilant and protect yourself online!');
