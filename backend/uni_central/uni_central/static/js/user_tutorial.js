// Smooth scrolling for links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const navHeight = document.querySelector('.tutorial-nav').offsetHeight;
          
          const offsetPosition = targetElement.getBoundingClientRect().top + 
                                 window.pageYOffset - 
                                 navHeight - 
                                 30; 
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Highlight current section in navigation
  window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('.tutorial-section');
    const navLinks = document.querySelectorAll('.tutorial-nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (pageYOffset >= (sectionTop - 100)) {
        currentSection = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });