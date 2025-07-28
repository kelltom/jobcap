document.addEventListener('DOMContentLoaded', () => {
  // Request job info from content script
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {action: "extract_job_info"},
      (response) => {
        if (chrome.runtime.lastError) {
          showError("Not an Indeed job page or extension not allowed on this page.");
          return;
        }
        if (response && response.success) {
          fillFields(response.data);
        } else {
          showError(response && response.error ? response.error : "Could not extract job info.");
        }
      }
    );
  });

  // Copy button logic
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-field');
      const value = document.getElementById(field).textContent;
      if (value && value !== "Not found") {
        navigator.clipboard.writeText(value);
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 900);
      }
    });
  });
});

function fillFields(data) {
  document.getElementById('role').textContent = data.role || "Not found";
  document.getElementById('company').textContent = data.company || "Not found";
  document.getElementById('officelocation').textContent = data.officelocation || "Not found";
  document.getElementById('jobtype').textContent = data.jobtype || "Not found";
  document.getElementById('worklocation').textContent = data.worklocation || "Not found";
  document.getElementById('pay').textContent = data.pay || "Not found";
  document.getElementById('error').textContent = "";
}

function showError(msg) {
  document.getElementById('error').textContent = msg;
  ['role','company','officelocation','jobtype','worklocation','pay'].forEach(id => {
    document.getElementById(id).textContent = "";
  });
}
