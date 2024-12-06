const dropdownMenu = document.querySelector('.dropdown-menu');
const dropdownMenuBtn = document.querySelector('.dropdown-menu-btn');

dropdownMenuBtn.addEventListener('click', () => {
  dropdownMenu.classList.toggle('active');
});

// Close the dropdown menu when clicking outside of it
window.addEventListener('click', (event) => {
  if (!event.target.matches('.dropdown-menu-btn') && !event.target.matches('.dropdown-menu-content *')) {
    if (dropdownMenu.classList.contains('active')) {
      dropdownMenu.classList.remove('active');
    }
  }
});