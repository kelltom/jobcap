
// --- Shared helpers ---
function cleanText(text) {
  return text ? text.replace(/\s+/g, " ").replace(/\s*- job post$/i, "").trim() : "";
}

function getTextBySelectors(root, selectors) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el && el.textContent && el.textContent.trim()) {
      return el.textContent.trim();
    }
  }
  return "";
}

// --- Indeed extractor ---
function extractIndeedJobInfo() {
  let section = document.querySelector('section#job-full-details') || document;

  // Role
  let role = cleanText(getTextBySelectors(section, [
    "h1",
    "h2.jobsearch-JobInfoHeader-title",
    "h2[data-testid=jobsearch-JobInfoHeader-title]",
    "h2"
  ]));
  if (!role) {
    let header = section.querySelector('.jobsearch-HeaderContainer, .jobsearch-InfoHeaderContainer');
    if (header) {
      let strong = header.querySelector('strong');
      if (strong) role = cleanText(strong.textContent);
    }
  }

  // Company
  let company = cleanText(getTextBySelectors(section, [
    'div[data-company-name="true"] span',
    'span.companyName',
    '[data-testid="inlineHeader-companyName"] a',
    '[data-testid="inlineHeader-companyName"]',
    'div[data-company-name="true"]',
    'div[data-testid="inlineHeader-companyName"]'
  ]));

  // Office Location
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
    let locParts = locText.split(/[•\u2022\|\-]/);
    officelocation = cleanText(locParts[0]);
  }
  if (!officelocation) {
    let desc = section.querySelector("div#jobDescriptionText");
    if (desc) {
      let m = desc.textContent.match(/Location:\s*([^\n\r]+)/i);
      if (m) officelocation = cleanText(m[1]);
    }
  }
  if (officelocation && officelocation.includes(",")) {
    let parts = officelocation.split(",");
    if (parts.length >= 2) {
      officelocation = parts.slice(-2).map(p => p.trim()).join(", ");
    }
  }

  // Job Type
  let jobtype = "";
  let jobtypeText = getTextBySelectors(section, [
    '#salaryInfoAndJobType span',
    '#salaryInfoAndJobType',
  ]);
  if (jobtypeText && /(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i.test(jobtypeText)) {
    jobtype = cleanText(jobtypeText.match(/(Full[- ]?time|Part[- ]?time|Remote|Contract|Temporary|Internship)/i)[0]);
  }
  if (!jobtype) {
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

  // Pay
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

  // Work Location
  let worklocation = "";
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

// --- LinkedIn extractor ---
function extractLinkedInJobInfo() {
  let section = document.querySelector('.jobs-search__job-details--wrapper') || document;

  // Role
  let role = cleanText(section.querySelector('[aria-label]')?.getAttribute('aria-label') ||
    getTextBySelectors(section, [
      '.job-details-jobs-unified-top-card__primary-description-container h1',
      'h1',
      'h2',
    ]));

  // Company
  let company = cleanText(getTextBySelectors(section, [
    '.ivm-view-attr__img--centered[alt$="logo"]',
    '.jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__subtitle a',
    '.jobs-unified-top-card__subtitle',
    'a[href*="/company/"]',
  ]));
  if (!company) {
    let img = section.querySelector('img[alt$="logo"]');
    if (img && img.alt) {
      company = cleanText(img.alt.replace(/ logo$/i, ''));
    }
  }

  // Office Location
  let officelocation = '';
  // Try to get from first .tvm__text element
  let tvm = section.querySelector('.tvm__text');
  if (tvm && tvm.textContent && tvm.textContent.trim()) {
    officelocation = cleanText(tvm.textContent);
  }
  // Fallback to previous logic if not found
  if (!officelocation) {
    let locText = getTextBySelectors(section, [
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__subtitle',
      '.jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__subtitle',
    ]);
    if (locText) {
      let m = locText.match(/([A-Za-z ]+,? [A-Za-z ]+)/);
      if (m) officelocation = cleanText(m[1]);
      else officelocation = cleanText(locText);
    }
  }
  if (!officelocation) {
    // Try to find 'Location:' label in job description
    let desc = section.querySelector('article.jobs-description__container, .jobs-description__container');
    if (desc) {
      // Look for <strong>Location:</strong> or text 'Location:'
      let strong = desc.querySelector('strong');
      if (strong && /Location:/i.test(strong.textContent)) {
        // Try nextSibling text
        let next = strong.nextSibling;
        if (next && next.textContent) {
          // Only take up to first line break, period, or HTML tag
          let raw = next.textContent.replace(/^[\s:]+/, '');
          let match = raw.match(/^([^.<\n\r<]+)/);
          if (match) officelocation = cleanText(match[1]);
          else officelocation = cleanText(raw.split(/\n|\r|\.|</)[0]);
        } else {
          // Fallback: search for 'Location:' in text
          let m = desc.textContent.match(/Location:\s*([^\n\r.<]+)/i);
          if (m) officelocation = cleanText(m[1]);
        }
      } else {
        // Fallback: search for 'Location:' in text
        let m = desc.textContent.match(/Location:\s*([^\n\r.<]+)/i);
        if (m) officelocation = cleanText(m[1]);
      }
    }
    // Final fallback: any city, province pattern in whole section
    if (!officelocation) {
      let m = section.textContent.match(/([A-Za-z ]+,? [A-Za-z ]+)/);
      if (m) officelocation = cleanText(m[1]);
    }
  }
  // If officelocation contains a comma, prefer last two parts (city, province/state)
  if (officelocation && officelocation.includes(",")) {
    let parts = officelocation.split(",");
    if (parts.length >= 2) {
      officelocation = parts.slice(-2).map(p => p.trim()).join(", ");
    }
  }

  // Work Location
  let worklocation = '';
  let wlMatch = section.textContent.match(/(Remote|Hybrid|In[- ]?person)/i);
  if (wlMatch) worklocation = cleanText(wlMatch[1]);

  // Job Type
  let jobtype = '';
  let jtMatch = section.textContent.match(/(Full[- ]?time|Part[- ]?time|Contract|Temporary|Internship)/i);
  if (jtMatch) jobtype = cleanText(jtMatch[1]);

  // Pay
  let pay = '';
  let payMatch = section.textContent.match(/([\w$CA€£]+[\d,.Kk]+\/?[a-zA-Z]*\s*[-–—]\s*[\w$CA€£]+[\d,.Kk]+\/?[a-zA-Z]*)/);
  if (payMatch) pay = cleanText(payMatch[1]);
  if (!pay) {
    let payAlt = section.textContent.match(/([\w$CA€£]+[\d,.Kk]+\/?[a-zA-Z]*)/);
    if (payAlt) pay = cleanText(payAlt[1]);
  }

  return { role, company, officelocation, worklocation, jobtype, pay };
}

function extractJobInfo() {
  const url = window.location.href;
  if (/indeed\.com/.test(url)) {
    return extractIndeedJobInfo();
  } else if (/linkedin\.com\/jobs/.test(url)) {
    return extractLinkedInJobInfo();
  } else {
    return { role: '', company: '', officelocation: '', jobtype: '', worklocation: '', pay: '' };
  }
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
