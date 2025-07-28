function extractJobInfo() {
  // Helper: Try selectors in order, return first non-empty trimmed text
  function getTextBySelectors(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return "";
  }

  // Helper: Normalize whitespace and remove trailing label text
  function cleanText(text) {
    return text ? text.replace(/\s+/g, " ").replace(/\s*- job post$/i, "").trim() : "";
  }

  // Main section fallback
  let section = document.querySelector('section#job-full-details') || document;

  // Role: Try h1, h2, fallback to first strong in header
  let role = cleanText(getTextBySelectors(section, [
    "h1",
    "h2.jobsearch-JobInfoHeader-title",
    "h2[data-testid=jobsearch-JobInfoHeader-title]",
    "h2"
  ]));
  if (!role) {
    // Fallback: first strong in header
    let header = section.querySelector('.jobsearch-HeaderContainer, .jobsearch-InfoHeaderContainer');
    if (header) {
      let strong = header.querySelector('strong');
      if (strong) role = cleanText(strong.textContent);
    }
  }

  // Company: Try multiple selectors, fallback to anchor in header
  let company = cleanText(getTextBySelectors(section, [
    'div[data-company-name="true"] span',
    'span.companyName',
    '[data-testid="inlineHeader-companyName"] a',
    '[data-testid="inlineHeader-companyName"]',
    'div[data-company-name="true"]',
    'div[data-testid="inlineHeader-companyName"]'
  ]));

  // Office Location: Try multiple selectors, split on bullet/pipe, fallback to job description
  let officelocation = "";
  let locText = getTextBySelectors(section, [
    '[data-testid="job-officelocation"]',
    'div.companyLocation',
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
    '#jobLocationText',
    '#jobLocationWrapper',
    '#jobLocationSectionWrapper'
  ]);
  if (locText) {
    // Split on bullet, pipe, or dash, take first part
    let locParts = locText.split(/[•\u2022\|\-]/);
    officelocation = cleanText(locParts[0]);
  }
  if (!officelocation) {
    // Fallback: look for 'Location:' in job description
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Location:\s*([^\n\r]+)/i);
      if (m) officelocation = cleanText(m[1]);
    }
  }
  // If officelocation contains a comma, prefer last two parts (city, province)
  if (officelocation && officelocation.includes(",")) {
    let parts = officelocation.split(",");
    if (parts.length >= 2) {
      officelocation = parts.slice(-2).map(p => p.trim()).join(", ");
    }
  }

  // Job Type: Try salaryInfoAndJobType, buttons, fallback to job description
  let jobtype = "";
  let jobtypeText = getTextBySelectors(section, [
    '#salaryInfoAndJobType span',
    '#salaryInfoAndJobType',
  ]);
  if (jobtypeText && /(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i.test(jobtypeText)) {
    jobtype = cleanText(jobtypeText.match(/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i)[0]);
  }
  if (!jobtype) {
    // Try buttons
    let btns = Array.from(section.querySelectorAll("button"));
    for (let btn of btns) {
      if (/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i.test(btn.textContent)) {
        jobtype = cleanText(btn.textContent.match(/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i)[0]);
        break;
      }
    }
  }
  if (!jobtype) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Job Type:\s*([^\n\r]+)/i);
      if (m) jobtype = cleanText(m[1]);
      else {
        let m2 = desc.textContent.match(/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i);
        if (m2) jobtype = cleanText(m2[1]);
      }
    }
  }

  // Pay: Try salaryInfoAndJobType, buttons, fallback to job description
  let pay = "";
  let payText = getTextBySelectors(section, [
    '#salaryInfoAndJobType span',
    '#salaryInfoAndJobType',
  ]);
  if (payText && /\$\d/.test(payText)) {
    pay = cleanText(payText.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+(?:\.\d{2})?)?/)[0]);
  }
  if (!pay) {
    let btns = Array.from(section.querySelectorAll("button"));
    for (let btn of btns) {
      if (/\$\d/.test(btn.textContent)) {
        pay = cleanText(btn.textContent.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+(?:\.\d{2})?)?/)[0]);
        break;
      }
    }
  }
  if (!pay) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Pay:\s*([^\n\r]+)/);
      if (m) pay = cleanText(m[1]);
      else {
        let m2 = desc.textContent.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+(?:\.\d{2})?)?/);
        if (m2) pay = cleanText(m2[0]);
      }
    }
  }
  if (pay) {
    pay = pay.replace(/a year|per year|–|—/gi, "-").replace(/\s+/g, " ").trim();
  }

  // Work Location: Hybrid, In-person, Remote
  let worklocation = "";
  // Try to find in company location, then fallback to section text
  let workLocText = getTextBySelectors(section, [
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
    '[data-testid="job-officelocation"]',
    'div.companyLocation',
    '#jobLocationText',
    '#jobLocationWrapper',
    '#jobLocationSectionWrapper'
  ]);
  if (workLocText) {
    if (/hybrid/i.test(workLocText)) worklocation = "Hybrid";
    else if (/remote/i.test(workLocText)) worklocation = "Remote";
    else if (/in[- ]?person/i.test(workLocText)) worklocation = "In-person";
  }
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
