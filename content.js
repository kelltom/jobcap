function extractJobInfo() {
  // Try to find the main job section
  let section = document.querySelector('section#job-full-details') || document;

  // Role
  let role = "";
  let h1 = section.querySelector("h1");
  if (h1 && h1.textContent.trim()) {
    role = h1.textContent.trim();
  } else {
    let h2 = section.querySelector("h2.jobsearch-JobInfoHeader-title");
    if (h2) {
      let span = h2.querySelector("span");
      role = span ? span.textContent.trim() : h2.textContent.trim();
      role = role.replace(/\s*- job post$/i, "");
    }
  }

  // Company
  let company = "";
  let div = section.querySelector('div[data-company-name="true"]');
  if (div) {
    let span = div.querySelector("span");
    if (span) company = span.textContent.trim();
  }
  if (!company) {
    let span = section.querySelector("span.companyName");
    if (span) company = span.textContent.trim();
  }
  if (!company) {
    let container = section.querySelector('[data-testid="inlineHeader-companyName"]');
    if (container) {
      let a = container.querySelector("a");
      if (a) company = a.textContent.trim();
    }
  }

  // Location
  let officelocation = "";
  // 1. Try [data-testid="job-officelocation"]
  let locDiv = section.querySelector('[data-testid="job-officelocation"]');
  if (locDiv) officelocation = locDiv.textContent.trim();

  // 2. Try div.companyLocation
  if (!officelocation) {
    let locSpan = section.querySelector("div.companyLocation");
    if (locSpan) officelocation = locSpan.textContent.trim();
  }

  // 3. Try [data-testid="jobsearch-JobInfoHeader-companyLocation"] (Indeed Canada and others)
  if (!officelocation) {
    let locTestId = section.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]');
    if (locTestId) {
      // Sometimes the text is like "Edmonton, AB•Hybrid work"; we want only the city/province
      let locText = locTestId.textContent.trim();
      // Split on bullet or other separator, take the first part
      let locParts = locText.split(/[•|\u2022|\|\-]/);
      if (locParts.length > 0) {
        officelocation = locParts[0].trim();
      } else {
        officelocation = locText;
      }
    }
  }

  // 4. Try job description fallback
  if (!officelocation) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Location:\s*(.+)/);
      if (m) officelocation = m[1].trim();
    }
  }

  // 5. If officelocation contains a comma, prefer last two parts (city, province)
  if (officelocation && officelocation.includes(",")) {
    let parts = officelocation.split(",");
    if (parts.length >= 2) {
      officelocation = parts.slice(-2).map(p => p.trim()).join(", ");
    }
  }

  // Type
  let jobtype = "";
  let jobtypeDiv = section.querySelector("div#salaryInfoAndJobType");
  if (jobtypeDiv) {
    jobtypeDiv.querySelectorAll("span").forEach(span => {
      if (!jobtype && /(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i.test(span.textContent)) {
        jobtype = span.textContent.trim();
      }
    });
  }
  if (!jobtype) {
    section.querySelectorAll("button").forEach(btn => {
      if (!jobtype && /(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i.test(btn.textContent)) {
        jobtype = btn.textContent.trim();
      }
    });
  }
  if (!jobtype) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Job Type:\s*([^\n\r]+)/i);
      if (m) jobtype = m[1].trim();
      else {
        let m2 = desc.textContent.match(/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i);
        if (m2) jobtype = m2[1];
      }
    }
  }
  if (jobtype) {
    jobtype = jobtype.replace(" -", "").replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  // Pay
  let pay = "";
  let payDiv = section.querySelector("div#salaryInfoAndJobType");
  if (payDiv) {
    payDiv.querySelectorAll("span").forEach(span => {
      if (!pay && /\$\d/.test(span.textContent)) {
        pay = span.textContent.trim();
      }
    });
  }
  if (!pay) {
    section.querySelectorAll("button").forEach(btn => {
      if (!pay && /\$\d/.test(btn.textContent)) {
        pay = btn.textContent.trim();
      }
    });
  }
  if (!pay) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Pay:\s*([^\n\r]+)/);
      if (m) pay = m[1].trim();
      else {
        let m2 = desc.textContent.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+(?:\.\d{2})?)?/);
        if (m2) pay = m2[0];
      }
    }
  }
  if (pay) {
    pay = pay.replace(/a year|per year|–|—/gi, "-").replace(/\s+/g, " ").trim();
  }

  // Work Type: Hybrid, In-person, Remote
  let worklocation = "";
  // Try [data-testid="jobsearch-JobInfoHeader-companyLocation"] and look for Hybrid/Remote/In-person
  let locTestId = section.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]');
  if (locTestId) {
    let text = locTestId.textContent;
    if (/hybrid/i.test(text)) worklocation = "Hybrid";
    else if (/remote/i.test(text)) worklocation = "Remote";
    else if (/in[- ]?person/i.test(text)) worklocation = "In-person";
  }
  // Fallback: look for these keywords in the whole section
  if (!worklocation) {
    let sectionText = section.textContent;
    if (/hybrid/i.test(sectionText)) worklocation = "Hybrid";
    else if (/remote/i.test(sectionText)) worklocation = "Remote";
    else if (/in[- ]?person/i.test(sectionText)) worklocation = "In-person";
  }

  return {role, company, officelocation, jobtype, worklocation, pay};
}

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_job_info") {
    try {
      const data = extractJobInfo();
      // If all fields are empty, probably not a job page
      if (!data.role && !data.company && !data.officelocation && !data.jobtype && !data.pay) {
        sendResponse({success: false, error: "No job info found on this page."});
      } else {
        sendResponse({success: true, data});
      }
    } catch (e) {
      sendResponse({success: false, error: "Error extracting job info."});
    }
    return true; // async
  }
});
