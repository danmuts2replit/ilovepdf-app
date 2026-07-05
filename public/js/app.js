document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const label = document.querySelector('label[for="file"]');
      if (label && fileInput.files.length) {
        const names = Array.from(fileInput.files).map((f) => f.name).join(', ');
        label.textContent = `Selected: ${names}`;
      }
    });
  }
});
