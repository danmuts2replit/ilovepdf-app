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
});
