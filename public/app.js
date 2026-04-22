document.addEventListener('DOMContentLoaded', () => {
  const isUploadPage = document.getElementById('uploadForm') !== null;
  const isDownloadPage = document.getElementById('downloadForm') !== null;

  // --- UPLOAD PAGE LOGIC ---
  if (isUploadPage) {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadText = document.getElementById('uploadText');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const btnText = uploadBtn.querySelector('.btn-text');
    const uploadLoader = document.getElementById('uploadLoader');
    const resultBox = document.getElementById('resultBox');
    const shareLink = document.getElementById('shareLink');
    const copyBtn = document.getElementById('copyBtn');
    const pinInput = document.getElementById('pinInput');
    const pinWarning = document.getElementById('pinWarning');
    const pinToggle = document.getElementById('pinToggle');
    const pinInputGroup = document.getElementById('pinInputGroup');

    let selectedFile = null;

    if (pinToggle && pinInputGroup) {
      pinToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          pinInputGroup.classList.remove('hidden');
          pinInput.required = true;
          pinInput.focus();
        } else {
          pinInputGroup.classList.add('hidden');
          pinInput.required = false;
          pinInput.value = '';
        }
      });
    }

    // Drag and Drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        handleFileSelect(fileInput.files[0]);
      }
    });

    function handleFileSelect(file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File is too large. Max size is 50MB.');
        return;
      }
      selectedFile = file;
      uploadText.textContent = `Selected: ${file.name}`;
      uploadText.style.color = 'var(--accent-color)';
    }

    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedFile) {
        alert('Please select a file first.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (pinToggle && pinToggle.checked && pinInput.value) {
        formData.append('pin', pinInput.value);
      }

      setLoading(uploadBtn, btnText, uploadLoader, true);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          shareLink.textContent = data.link;
          if (data.hasPin) {
            pinWarning.classList.remove('hidden');
          } else {
            pinWarning.classList.add('hidden');
          }
          resultBox.classList.add('show');
          uploadForm.reset();
          selectedFile = null;
          uploadText.textContent = 'Drag & Drop or Click to Upload';
          uploadText.style.color = 'var(--text-primary)';
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) {
        alert('An error occurred during upload.');
        console.error(err);
      } finally {
        setLoading(uploadBtn, btnText, uploadLoader, false);
      }
    });

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(shareLink.textContent)
        .then(() => {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => copyBtn.innerHTML = originalHTML, 2000);
        })
        .catch(() => alert('Failed to copy link.'));
    });
  }

  // --- DOWNLOAD PAGE LOGIC ---
  if (isDownloadPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessageText = document.getElementById('errorMessageText');
    const downloadState = document.getElementById('downloadState');
    const displayFileName = document.getElementById('displayFileName');
    const pinGroup = document.getElementById('pinGroup');
    const downloadForm = document.getElementById('downloadForm');
    const downloadPin = document.getElementById('downloadPin');
    const pinError = document.getElementById('pinError');
    const downloadBtn = document.getElementById('downloadBtn');
    const btnText = downloadBtn.querySelector('.btn-text');
    const downloadLoader = document.getElementById('downloadLoader');

    let fileRequiresPin = false;

    if (!fileId) {
      showError('No file ID provided in the URL.');
      return;
    }

    // Fetch file info
    fetch(`/api/file/${fileId}/info`)
      .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
      .then(({ status, ok, body }) => {
        loadingState.classList.add('hidden');
        if (ok) {
          displayFileName.textContent = body.originalName;
          fileRequiresPin = body.hasPin;
          if (fileRequiresPin) {
            pinGroup.classList.remove('hidden');
            downloadPin.required = true;
          }
          downloadState.classList.remove('hidden');
        } else {
          showError(body.error || 'File not found');
        }
      })
      .catch(err => {
        loadingState.classList.add('hidden');
        showError('Network error while fetching file info.');
        console.error(err);
      });

    downloadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      pinError.style.display = 'none';
      setLoading(downloadBtn, btnText, downloadLoader, true);

      const payload = {};
      if (fileRequiresPin) {
        payload.pin = downloadPin.value;
      }

      try {
        const response = await fetch(`/api/file/${fileId}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Trigger download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          // Extract filename from Content-Disposition header if possible, else use display name
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = displayFileName.textContent;
          if (contentDisposition && contentDisposition.includes('filename=')) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          }
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          
          if(fileRequiresPin) downloadPin.value = '';
        } else {
          const data = await response.json();
          if (response.status === 401) {
            pinError.textContent = 'Incorrect PIN. Please try again.';
            pinError.style.display = 'block';
          } else {
            alert(data.error || 'Download failed');
          }
        }
      } catch (err) {
        alert('An error occurred during download.');
        console.error(err);
      } finally {
        setLoading(downloadBtn, btnText, downloadLoader, false);
      }
    });

    function showError(message) {
      loadingState.classList.add('hidden');
      downloadState.classList.add('hidden');
      errorMessageText.textContent = message;
      errorState.classList.remove('hidden');
    }
  }

  function setLoading(btn, textElement, loader, isLoading) {
    if (isLoading) {
      btn.disabled = true;
      textElement.style.opacity = '0';
      loader.style.display = 'block';
      loader.style.position = 'absolute';
    } else {
      btn.disabled = false;
      textElement.style.opacity = '1';
      loader.style.display = 'none';
    }
  }
});
