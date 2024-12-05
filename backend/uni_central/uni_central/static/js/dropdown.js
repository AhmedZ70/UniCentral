document.addEventListener("DOMContentLoaded", () => {
    const menuIcon = document.querySelector(".menu-icon");
    menuIcon.addEventListener("click", () => {
      menuIcon.classList.toggle("active");
    });
  });
  
  function navigateTo(option) {
    // Example navigation logic
    alert(`Navigating to ${option}`);
  }
  