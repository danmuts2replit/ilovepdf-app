document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const label = document.querySelector('label[for="file"]');
      if (label && fileInput.files.length) {
        label.textContent = `Selected: ${fileInput.files[0].name}`;
      }
    });
  }

  const tabs = document.querySelectorAll('.category-tab');
  const groups = document.querySelectorAll('[data-category-group]');
  if (tabs.length && groups.length) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.dataset.category;
        groups.forEach((group) => {
          const match = category === 'all' || group.dataset.categoryGroup === category;
          group.style.display = match ? '' : 'none';
        });
      });
    });
  }
});
