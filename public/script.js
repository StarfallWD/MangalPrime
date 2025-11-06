document.addEventListener('DOMContentLoaded', function () {
  // Set video playback rate to 0.7
  const backgroundVideo = document.querySelector('.background-video');
  if (backgroundVideo) {
    backgroundVideo.playbackRate = 0.7;
    // Ensure playback rate is set even after video loads
    backgroundVideo.addEventListener('loadedmetadata', function () {
      this.playbackRate = 0.7;
    });
  }

  const contactForm = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    // Disable submit button
    const submitBtn = contactForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Hide previous messages
    formMessage.style.display = 'none';
    formMessage.className = 'form-message';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        formMessage.className = 'form-message success';
        formMessage.textContent = data.message;
        formMessage.style.display = 'block';
        contactForm.reset();
      } else {
        formMessage.className = 'form-message error';
        formMessage.textContent = data.message || 'An error occurred. Please try again.';
        formMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Error:', error);
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Network error. Please check your connection and try again.';
      formMessage.style.display = 'block';
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
});

