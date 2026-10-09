document.addEventListener('DOMContentLoaded', function () {
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const href = link.getAttribute('href');
      if (!href || href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const projectCarousel = document.querySelector('.project-carousel');
  if (projectCarousel) {
    const projectTrack = projectCarousel.querySelector('.project-showcase');
    const projectSlides = projectCarousel.querySelectorAll('.project-feature');
    const projectStatus = projectCarousel.querySelector('.project-carousel-status');
    const carouselButtons = projectCarousel.querySelectorAll('[data-project-direction]');
    let currentProject = 0;
    let touchStartX = 0;

    function showProject(index) {
      currentProject = (index + projectSlides.length) % projectSlides.length;
      projectTrack.style.transform = 'translateX(-' + (currentProject * 100) + '%)';
      projectStatus.textContent = 'Project ' + (currentProject + 1) + ' of ' + projectSlides.length;
    }

    carouselButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const direction = button.getAttribute('data-project-direction');
        showProject(currentProject + (direction === 'next' ? 1 : -1));
      });
    });

    projectCarousel.addEventListener('pointerdown', function (event) {
      touchStartX = event.clientX;
    });

    projectCarousel.addEventListener('pointerup', function (event) {
      const swipeDistance = event.clientX - touchStartX;
      if (Math.abs(swipeDistance) < 50) return;
      showProject(currentProject + (swipeDistance < 0 ? 1 : -1));
    });

    showProject(0);
  }

  const leadershipSection = document.getElementById('leadership');
  if (leadershipSection) {
    const leadershipToggles = leadershipSection.querySelectorAll('.leadership-toggle');
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    leadershipToggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        const label = toggle.querySelector('.leadership-toggle-label');
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

        if (!panel || !label) return;

        toggle.setAttribute('aria-expanded', String(!isExpanded));
        label.textContent = isExpanded ? 'Read More' : 'Show Less';

        if (isExpanded) {
          panel.classList.remove('is-open');
          panel.style.maxHeight = '0px';

          if (isReducedMotion) {
            panel.hidden = true;
          } else {
            panel.addEventListener('transitionend', function hidePanel(event) {
              if (event.propertyName === 'max-height' && toggle.getAttribute('aria-expanded') === 'false') {
                panel.hidden = true;
              }
            }, { once: true });
          }
        } else {
          panel.hidden = false;
          panel.classList.add('is-open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || revealEls.length === 0) {
    revealEls.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        
        // Trigger skills animation
        const skillsGrid = entry.target.querySelector('.skills-grid');
        if (skillsGrid) {
          skillsGrid.classList.add('reveal-ready');
        }

        const aboutEditorial = entry.target.querySelector('.about-editorial');
        if (aboutEditorial) {
          aboutEditorial.classList.add('is-revealed');
        }

        const leadershipShowcase = entry.target.classList.contains('leadership-showcase')
          ? entry.target
          : entry.target.querySelector('.leadership-showcase');
        if (leadershipShowcase) {
          leadershipShowcase.classList.add('is-revealed');
        }

        const experienceTimeline = entry.target.querySelector('.timeline');
        if (experienceTimeline) {
          experienceTimeline.classList.add('is-revealed');
        }
        
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
  });

  const faqSection = document.getElementById('faq');
  if (faqSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    faqSection.querySelectorAll('.faq-item').forEach(function (item) {
      const summary = item.querySelector('summary');
      if (!summary) return;

      summary.addEventListener('click', function (event) {
        event.preventDefault();

        if (item.dataset.animating === 'true') return;
        item.dataset.animating = 'true';

        if (item.open) {
          item.style.height = item.offsetHeight + 'px';

          requestAnimationFrame(function () {
            item.style.height = summary.offsetHeight + 'px';
          });

          item.addEventListener('transitionend', function closeItem(event) {
            if (event.propertyName !== 'height') return;
            item.open = false;
            item.style.height = '';
            item.dataset.animating = 'false';
          }, { once: true });
        } else {
          const closedHeight = summary.offsetHeight;
          item.open = true;
          const openHeight = item.scrollHeight;

          item.style.height = closedHeight + 'px';
          requestAnimationFrame(function () {
            item.style.height = openHeight + 'px';
          });

          item.addEventListener('transitionend', function openItem(event) {
            if (event.propertyName !== 'height') return;
            item.style.height = '';
            item.dataset.animating = 'false';
          }, { once: true });
        }
      });
    });
  }

  // Contact Form Modal Functionality
  const contactModal = document.getElementById('contactModal');
  const requestInfoBtn = document.querySelector('.request-info-btn');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (requestInfoBtn && contactModal) {
    // Open modal
    requestInfoBtn.addEventListener('click', function () {
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Close modal
    function closeModal() {
      contactModal.classList.remove('active');
      document.body.style.overflow = '';
      contactForm.reset();
      formSuccess.classList.remove('show');
      clearAllErrors();
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && contactModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Form validation
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function validatePhone(phone) {
      if (!phone) return true; // Phone is optional
      const phoneRegex = /^[\d\s()\-+.]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    function clearError(fieldId) {
      const errorEl = document.getElementById(fieldId + 'Error');
      if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
      }
    }

    function showError(fieldId, message) {
      const errorEl = document.getElementById(fieldId + 'Error');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
      }
    }

    function clearAllErrors() {
      const errorEls = document.querySelectorAll('.form-error');
      errorEls.forEach(function (el) {
        el.classList.remove('show');
        el.textContent = '';
      });
    }

    // Form submission
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors();

      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const message = document.getElementById('message').value.trim();

      let isValid = true;

      // Validate first name
      if (!firstName) {
        showError('firstName', 'First name is required');
        isValid = false;
      }

      // Validate last name
      if (!lastName) {
        showError('lastName', 'Last name is required');
        isValid = false;
      }

      // Validate email
      if (!email) {
        showError('email', 'Email is required');
        isValid = false;
      } else if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email');
        isValid = false;
      }

      // Validate phone if provided
      if (phone && !validatePhone(phone)) {
        showError('phone', 'Please enter a valid phone number');
        isValid = false;
      }

      // Validate message
      if (!message) {
        showError('message', 'Message is required');
        isValid = false;
      }

      if (isValid) {
        // Submit form using Formspree
        const formData = new FormData(contactForm);
        const submitBtn = contactForm.querySelector('button[type=\"submit\"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'SENDING...';

        fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(function (response) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            if (response.ok) {
              formSuccess.classList.add('show');
              contactForm.reset();
              setTimeout(function () {
                closeModal();
              }, 2000);
            } else {
              showError('message', 'There was an error sending your message. Please try again.');
            }
          })
          .catch(function (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            showError('message', 'There was an error sending your message. Please try again.');
            console.error('Error:', error);
          });
      }
    });
  }
});
