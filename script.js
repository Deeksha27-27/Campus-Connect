/**
 * ============================================================================
 * CAMPUSCONNECT - CORE APPLICATION ENGINE
 * "Right Resource. Right Person. Right Now."
 * 
 * Hackathon Prototype for:
 * "The 20-Minute Problem – Intelligent Campus Resource Coordination"
 * 
 * Built with: Vanilla JavaScript & Object-Oriented Programming (OOP)
 * Clean, simple, readable, and easy to explain!
 * ============================================================================
 */

// ============================================================================
// 1. OBJECT-ORIENTED PROGRAMMING: DATA CLASSES
// ============================================================================

/**
 * Represents a student peer in the campus network
 */
class Student {
  constructor(id, name, department, semester, skills, availability, location, avatar = "👨‍💻", email = "") {
    this.id = id;
    this.name = name;
    this.department = department;
    this.semester = semester;
    this.skills = skills;             // Array of skill strings: ["Python", "Machine Learning"]
    this.availability = availability; // "Available", "In Class", "Busy"
    this.location = location;         // e.g. "Block B"
    this.avatar = avatar;
    this.email = email || `${name.toLowerCase()}@campus.edu`;
  }
}

/**
 * Represents a physical campus resource (lab, system, device, room)
 */
class Resource {
  constructor(id, name, type, available, total, location, status = "Available", icon = "💻", description = "") {
    this.id = id;
    this.name = name;
    this.type = type;                 // e.g. "Computer Lab", "3D Printer", "Study Room"
    this.available = available;       // current count available right now
    this.total = total;               // total capacity
    this.location = location;         // e.g. "Block B"
    this.status = status;             // "Available" or "Busy" or "Maintenance"
    this.icon = icon;
    this.description = description;
  }
}

/**
 * Represents a confirmed room or equipment booking
 */
class Booking {
  constructor(id, studentName, resourceName, date, time, duration, purpose = "Study / Project", status = "Confirmed") {
    this.id = id;
    this.studentName = studentName;
    this.resourceName = resourceName;
    this.date = date;
    this.time = time;
    this.duration = duration;
    this.purpose = purpose;
    this.status = status;
    this.createdAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Represents a student coordination request with the 5-step timeline
 */
class CampusRequest {
  constructor(id, title, category, targetPerson = null, targetResource = null, step = 3) {
    this.id = id;
    this.title = title;
    this.category = category;
    this.targetPerson = targetPerson;
    this.targetResource = targetResource;
    this.step = step; // 1: Created, 2: Understood, 3: Matched, 4: Connected, 5: Completed
    this.status = step >= 4 ? "Connected" : (step === 3 ? "Matched" : "In Progress");
    this.timestamp = "Just now";
  }
}

// ============================================================================
// 2. OOP CLASS: CAMPUS MATCHER (Intelligent Rule-Based Matching Engine)
// ============================================================================

/**
 * CampusMatcher understands natural language requests from students
 * and matches the right person and right resource with explainability.
 */
class CampusMatcher {
  constructor(studentsList, resourcesList) {
    this.students = studentsList;
    this.resources = resourcesList;

    // Keyword dictionaries for intelligent understanding
    this.skillKeywords = {
      "python": "Python",
      "machine learning": "Machine Learning",
      "ai": "Machine Learning",
      "java": "Java",
      "web": "Web Development",
      "html": "Web Development",
      "css": "Web Development",
      "javascript": "Web Development",
      "react": "Web Development",
      "c++": "C++",
      "data structures": "C++",
      "arduino": "Arduino",
      "iot": "Arduino",
      "electronics": "Oscilloscope",
      "cad": "CAD Design",
      "3d design": "CAD Design",
      "app": "Flutter",
      "flutter": "Flutter",
      "ui/ux": "Figma",
      "figma": "Figma"
    };

    this.resourceKeywords = {
      "laptop": "Computer Lab",
      "system": "Computer Lab",
      "computer": "Computer Lab",
      "pc": "Computer Lab",
      "lab": "Computer Lab",
      "3d printer": "3D Printer",
      "printer": "3D Printer",
      "oscilloscope": "Oscilloscope",
      "soldering": "Electronics Lab",
      "study": "Study Space",
      "quiet": "Study Space",
      "room": "Study Space",
      "vr": "VR Headset",
      "headset": "VR Headset",
      "camera": "AV Studio"
    };
  }

  /**
   * Understands what the student wrote using keyword & intent detection
   */
  understandRequest(text) {
    const lower = text.toLowerCase();

    // 1. Detect required skills
    let detectedSkill = null;
    for (const [key, val] of Object.entries(this.skillKeywords)) {
      if (lower.includes(key)) {
        detectedSkill = val;
        break;
      }
    }

    // 2. Detect required resources
    let detectedResourceType = null;
    for (const [key, val] of Object.entries(this.resourceKeywords)) {
      if (lower.includes(key)) {
        detectedResourceType = val;
        break;
      }
    }

    // Default fallbacks if open-ended search
    if (!detectedSkill && !detectedResourceType) {
      if (lower.includes("code") || lower.includes("project")) {
        detectedSkill = "Python";
        detectedResourceType = "Computer Lab";
      } else {
        detectedSkill = "Python";
        detectedResourceType = "Computer Lab";
      }
    } else if (!detectedSkill && detectedResourceType) {
      // e.g. "I need a 3D printer" -> auto-suggest CAD peer
      detectedSkill = "CAD Design";
    } else if (detectedSkill && !detectedResourceType) {
      // e.g. "Someone who knows Java" -> auto-suggest workstation/lab
      detectedResourceType = "Computer Lab";
    }

    // 3. Detect urgency & location
    const isImmediate = lower.includes("now") || lower.includes("urgent") || lower.includes("today") || true;
    let preferredBlock = "Block B"; // default nearby block for user
    if (lower.includes("block a")) preferredBlock = "Block A";
    if (lower.includes("block c")) preferredBlock = "Block C";
    if (lower.includes("library")) preferredBlock = "Library";

    return {
      skill: detectedSkill,
      resourceType: detectedResourceType,
      urgency: isImmediate ? "Immediate (Under 20 Mins)" : "Scheduled",
      preferredLocation: preferredBlock,
      originalText: text
    };
  }

  /**
   * Finds students who have the required skill and scores them
   */
  findPeople(skillName, userLocation = "Block B") {
    const candidates = [];

    this.students.forEach(student => {
      // Check if student knows the skill (case-insensitive)
      const hasSkill = student.skills.some(s => s.toLowerCase() === skillName.toLowerCase());

      if (hasSkill) {
        // Calculate explainable score
        const breakdown = this.calculatePersonMatch(student, skillName, userLocation);
        candidates.push({
          student: student,
          score: breakdown.totalScore,
          reasons: breakdown.reasons
        });
      }
    });

    // Sort by highest match score first
    candidates.sort((a, b) => b.score - a.score);

    // If no direct skill match, pick best available helper
    if (candidates.length === 0 && this.students.length > 0) {
      const fallback = this.students[0];
      const breakdown = this.calculatePersonMatch(fallback, fallback.skills[0], userLocation);
      candidates.push({
        student: fallback,
        score: 75,
        reasons: breakdown.reasons
      });
    }

    return candidates;
  }

  /**
   * Finds campus resources that match the category and are currently available
   */
  findResources(resourceType, userLocation = "Block B") {
    const candidates = [];

    this.resources.forEach(res => {
      const typeMatches = res.type.toLowerCase().includes(resourceType.toLowerCase()) ||
                          res.name.toLowerCase().includes(resourceType.toLowerCase());

      if (typeMatches) {
        const breakdown = this.calculateResourceMatch(res, userLocation);
        candidates.push({
          resource: res,
          score: breakdown.totalScore,
          reasons: breakdown.reasons
        });
      }
    });

    // Sort by highest score first
    candidates.sort((a, b) => b.score - a.score);

    // If none found, fallback to first available computer lab
    if (candidates.length === 0 && this.resources.length > 0) {
      const fallback = this.resources[0];
      const breakdown = this.calculateResourceMatch(fallback, userLocation);
      candidates.push({
        resource: fallback,
        score: 80,
        reasons: breakdown.reasons
      });
    }

    return candidates;
  }

  /**
   * Explainable matching for Student Peer:
   * Skill Match: +40
   * Availability: +30
   * Location Proximity: +20
   * Time Match: +10
   * Total = 100
   */
  calculatePersonMatch(student, targetSkill, userLocation) {
    let score = 0;
    const reasons = [];

    // 1. Skill Match
    score += 40;
    reasons.push({ text: `Has ${targetSkill} skill`, points: "+40" });

    // 2. Availability
    if (student.availability === "Available") {
      score += 30;
      reasons.push({ text: "Available now right away", points: "+30" });
    } else if (student.availability === "In Class") {
      score += 15;
      reasons.push({ text: "In class (free in 15 mins)", points: "+15" });
    } else {
      score += 5;
      reasons.push({ text: "Busy (next slot at 4 PM)", points: "+5" });
    }

    // 3. Location Proximity
    if (student.location === userLocation) {
      score += 20;
      reasons.push({ text: `Nearby in ${student.location} (<2 min walk)`, points: "+20" });
    } else {
      score += 10;
      reasons.push({ text: `In ${student.location} (~5 min walk)`, points: "+10" });
    }

    // 4. Time Slot
    score += 10;
    reasons.push({ text: "Matches current 20-min work window", points: "+10" });

    return { totalScore: score, reasons: reasons };
  }

  /**
   * Explainable matching for Resource:
   * Equipment/Lab Match: +40
   * Real-time Units Available: +30
   * Location Proximity: +20
   * Immediate Access: +10
   */
  calculateResourceMatch(resource, userLocation) {
    let score = 0;
    const reasons = [];

    // 1. Resource Match
    score += 40;
    reasons.push({ text: `Exact match: ${resource.name} (${resource.type})`, points: "+40" });

    // 2. Availability
    if (resource.available > 0 && resource.status === "Available") {
      score += 30;
      reasons.push({ text: `${resource.available} units currently free`, points: "+30" });
    } else {
      score += 10;
      reasons.push({ text: "High demand / Waitlist open", points: "+10" });
    }

    // 3. Proximity
    if (resource.location === userLocation) {
      score += 20;
      reasons.push({ text: `Same building (${resource.location})`, points: "+20" });
    } else {
      score += 12;
      reasons.push({ text: `Located in ${resource.location}`, points: "+12" });
    }

    // 4. Instant walk-in
    score += 10;
    reasons.push({ text: "No faculty prerequisite needed", points: "+10" });

    return { totalScore: score, reasons: reasons };
  }

  /**
   * Generates the complete recommendation package:
   * Student Need -> Understood Requirement -> Best Person + Best Resource
   */
  generateRecommendation(text, userLocation = "Block B") {
    const understood = this.understandRequest(text);
    const peopleMatches = this.findPeople(understood.skill, userLocation);
    const resourceMatches = this.findResources(understood.resourceType, userLocation);

    return {
      understood: understood,
      bestPersonMatch: peopleMatches[0] || null,
      allPeopleMatches: peopleMatches,
      bestResourceMatch: resourceMatches[0] || null,
      allResourceMatches: resourceMatches
    };
  }
}

// ============================================================================
// 3. SEED DATA INITIALIZATION
// ============================================================================

// Current Logged-in Student state
let currentStudent = {
  name: "Priya Sharma",
  id: "CS2024042",
  department: "ISE",
  semester: "4th Semester",
  location: "Block B",
  skills: ["Python", "HTML", "CSS", "SQL", "Git"],
  availability: "Available"
};

// Initial Student Directory (Objects instantiated from Student class)
const studentsData = [
  new Student(1, "Rahul", "ISE", "6th Semester", ["Python", "Machine Learning", "FastAPI"], "Available", "Block B", "👨‍💻"),
  new Student(2, "Ananya", "CSE", "4th Semester", ["Java", "Web Development", "Spring Boot"], "Busy", "Block A", "👩‍💻"),
  new Student(3, "Karthik", "ECE", "6th Semester", ["Arduino", "IoT", "Oscilloscope", "C++"], "Available", "Block C", "👨‍🔧"),
  new Student(4, "Sneha", "Mechanical", "4th Semester", ["CAD Design", "3D Printing", "SolidWorks"], "Available", "Innovation Lab", "👩‍🔬"),
  new Student(5, "Aditya", "CSE", "8th Semester", ["Python", "Django", "PostgreSQL", "Docker"], "In Class", "Block B", "👨‍💻"),
  new Student(6, "Meera", "ISE", "4th Semester", ["Web Development", "Figma", "UI/UX", "JavaScript"], "Available", "Library", "👩‍🎨")
];

// Initial Resource Inventory (Objects instantiated from Resource class)
const resourcesData = [
  new Resource(101, "Lab 204", "Computer Lab", 3, 10, "Block B", "Available", "💻", "High-spec i7 workstations with GPU"),
  new Resource(102, "Electronics Lab", "Oscilloscope", 2, 4, "Block C", "Available", "⚡", "Digital storage oscilloscopes & multimeters"),
  new Resource(103, "MakerSpace 3D Hub", "3D Printer", 1, 2, "Innovation Lab", "Available", "🖨️", "Creality Ender-3 Pro 3D Printers"),
  new Resource(104, "Quiet Pod 3", "Study Space", 4, 6, "Library", "Available", "📚", "Sound-dampened quiet study chamber with whiteboard"),
  new Resource(105, "Lab 102 (AI Center)", "Computer Lab", 0, 15, "Block A", "Busy", "🤖", "Nvidia RTX workstations (Class currently in session)"),
  new Resource(106, "AV Recording Studio", "AV Studio", 1, 1, "Block C", "Available", "🎙️", "Podcast mics, 4K camera, green screen")
];

// Initial Confirmed Bookings
const bookingsData = [
  new Booking("CC1021", "Priya Sharma", "Lab 204", "Today", "11:00 AM – 12:00 PM", "1 Hour", "Python Data Analysis", "Confirmed"),
  new Booking("CC1019", "Rahul", "MakerSpace 3D Hub", "Yesterday", "2:00 PM – 4:00 PM", "2 Hours", "Robotics Chassis Print", "Completed")
];

// Initial Requests with 5-step progress
const requestsData = [
  new CampusRequest("REQ-101", "Python Project Help & Workstation", "Peer + Lab", "Rahul", "Lab 204", 4),
  new CampusRequest("REQ-098", "Oscilloscope for Sensor Calibration", "Equipment", null, "Electronics Lab", 5)
];

// Initial Notifications
const notificationsData = [
  { id: 1, text: "Rahul accepted your request to connect for Python.", time: "5 mins ago", icon: "🔔", unread: true },
  { id: 2, text: "Lab 204 has 3 workstations available right now.", time: "18 mins ago", icon: "💻", unread: true },
  { id: 3, text: "Reminder: Hackathon submission deadline in 2 hours.", time: "1 hour ago", icon: "⚡", unread: false }
];

// Instantiate Matcher Engine
const campusMatcher = new CampusMatcher(studentsData, resourcesData);

// Active live interval tracker
let livePulseInterval = null;

// ============================================================================
// 4. UI HELPER & NOTIFICATION SYSTEM
// ============================================================================

/**
 * Displays floating toast notifications in the top-right corner
 */
function showToast(title, message, type = "primary") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "🔔";
  if (type === "success") icon = "✓";
  if (type === "warning") icon = "⚠️";
  if (type === "danger") icon = "✕";

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Appends a notification to the in-app list and increments unread badge
 */
function addCampusNotification(text, icon = "🔔") {
  const notif = {
    id: Date.now(),
    text: text,
    time: "Just now",
    icon: icon,
    unread: true
  };
  notificationsData.unshift(notif);
  renderNotifications();
  updateNotificationBadges();
}

function updateNotificationBadges() {
  const unreadCount = notificationsData.filter(n => n.unread).length;
  const badge = document.getElementById("notifBadgeCount");
  const sidebarBadge = document.getElementById("sidebarNotifBadge");

  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";
  }
  if (sidebarBadge) {
    sidebarBadge.textContent = unreadCount;
    sidebarBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
  }
}

// ============================================================================
// 5. NAVIGATION CONTROLLER (Tabs & Views)
// ============================================================================

function switchTab(tabId) {
  // Update sidebar active link
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.getAttribute("data-tab") === tabId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Show corresponding tab pane
  const tabPanes = document.querySelectorAll(".tab-pane");
  tabPanes.forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });

  // Re-render specific tab data when visited
  if (tabId === "people") renderPeople();
  if (tabId === "resources") renderResources();
  if (tabId === "requests") renderRequests();
  if (tabId === "bookings") renderBookings();
  if (tabId === "notifications") renderNotifications();
  if (tabId === "admin") renderAdmin();
  if (tabId === "owner") renderOwner();
  if (tabId === "profile") renderProfile();
}

// ============================================================================
// 6. MAIN MATCHING FLOW (The Core Demonstration)
// ============================================================================

/**
 * Executes intelligent search from the Dashboard input box
 */
function handleSmartSearch(customQuery = null) {
  const input = document.getElementById("smartSearchInput");
  const query = customQuery || (input ? input.value.trim() : "");

  if (!query) {
    showToast("Empty Request", "Please describe what person, skill, or resource you need.", "warning");
    return;
  }

  if (input) input.value = query;

  // Run Matcher Engine
  const result = campusMatcher.generateRecommendation(query, currentStudent.location);

  // Render the result container
  renderSmartResult(result);
}

/**
 * Renders the Understood Request chips and Best Matches
 */
function renderSmartResult(result) {
  const container = document.getElementById("searchResultsContainer");
  if (!container) return;

  container.classList.add("visible");
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const { understood, bestPersonMatch, bestResourceMatch } = result;

  // 1. Understood Chips
  const understoodContainer = document.getElementById("understoodChipsContainer");
  if (understoodContainer) {
    understoodContainer.innerHTML = `
      <span class="understood-chip">💻 ${understood.resourceType || "Resource"}</span>
      <span class="understood-chip">🐍 ${understood.skill || "Technical"} Assistance</span>
      <span class="understood-chip urgency">⏱ ${understood.urgency}</span>
      <span class="understood-chip">📍 Near ${understood.preferredLocation}</span>
    `;
  }

  // 2. Person Match Card
  const personCard = document.getElementById("bestPersonCard");
  if (personCard && bestPersonMatch) {
    const student = bestPersonMatch.student;
    const isAvail = student.availability === "Available";

    let reasonsHtml = "";
    bestPersonMatch.reasons.forEach(r => {
      reasonsHtml += `
        <li class="explain-item">
          <span class="explain-check">✓</span>
          <span>${r.text}</span>
          <span class="explain-score-pts">${r.points}</span>
        </li>
      `;
    });

    personCard.innerHTML = `
      <div class="match-card-header">
        <span class="match-tag person">Best Peer Match</span>
        <span class="score-badge">Match Score: ${bestPersonMatch.score}/100</span>
      </div>

      <div class="match-entity-info">
        <div class="entity-avatar">${student.avatar}</div>
        <div class="entity-details">
          <h4>${student.name}</h4>
          <div class="entity-subtitle">${student.department} • ${student.skills.slice(0, 2).join(" • ")}</div>
        </div>
      </div>

      <div class="status-row">
        <span class="status-badge-inline ${isAvail ? 'avail' : 'busy'}">
          ${isAvail ? '🟢 Available now' : '🟡 ' + student.availability}
        </span>
        <span>📍 ${student.location} (<2 min walk)</span>
      </div>

      <div class="explain-box">
        <div class="explain-header">
          <span>WHY MATCHED?</span>
          <span>Intelligent Scoring</span>
        </div>
        <ul class="explain-list">
          ${reasonsHtml}
        </ul>
      </div>

      <div class="match-actions">
        <button class="btn btn-primary btn-block" id="btnConnectMatch" onclick="connectWithPeer('${student.name}', '${understood.skill}')">
          Connect with ${student.name}
        </button>
      </div>
    `;
  }

  // 3. Resource Match Card
  const resCard = document.getElementById("bestResourceCard");
  if (resCard && bestResourceMatch) {
    const res = bestResourceMatch.resource;
    const isAvail = res.available > 0;

    let reasonsHtml = "";
    bestResourceMatch.reasons.forEach(r => {
      reasonsHtml += `
        <li class="explain-item">
          <span class="explain-check">✓</span>
          <span>${r.text}</span>
          <span class="explain-score-pts">${r.points}</span>
        </li>
      `;
    });

    resCard.innerHTML = `
      <div class="match-card-header">
        <span class="match-tag resource">Best Resource Match</span>
        <span class="score-badge">Match Score: ${bestResourceMatch.score}/100</span>
      </div>

      <div class="match-entity-info">
        <div class="entity-avatar">${res.icon}</div>
        <div class="entity-details">
          <h4>${res.name}</h4>
          <div class="entity-subtitle">${res.type}</div>
        </div>
      </div>

      <div class="status-row">
        <span class="status-badge-inline ${isAvail ? 'avail' : 'busy'}">
          💻 ${res.available} systems available
        </span>
        <span class="status-badge-inline avail">🟢 Available now</span>
        <span>📍 ${res.location}</span>
      </div>

      <div class="explain-box">
        <div class="explain-header">
          <span>WHY MATCHED?</span>
          <span>Lab & Capacity Check</span>
        </div>
        <ul class="explain-list">
          ${reasonsHtml}
        </ul>
      </div>

      <div class="match-actions">
        <button class="btn btn-primary btn-block" onclick="openReservationModal('${res.name}')">
          Reserve ${res.name}
        </button>
      </div>
    `;
  }
}

/**
 * Connect with peer action:
 * Updates state, logs request, shows toast & notification, changes button state!
 */
function connectWithPeer(peerName, skillName) {
  // Update button in UI
  const btn = document.getElementById("btnConnectMatch");
  if (btn) {
    btn.innerHTML = `✓ Connected with ${peerName}`;
    btn.className = "btn btn-success btn-block";
    btn.disabled = true;
  }

  // Create new active request in the tracking list
  const newReq = new CampusRequest(
    `REQ-${Math.floor(100 + Math.random() * 900)}`,
    `${skillName} Assistance with ${peerName}`,
    "Peer Collaboration",
    peerName,
    "Lab 204",
    4 // Status: Connected!
  );
  requestsData.unshift(newReq);

  // Add dynamic notifications
  addCampusNotification(`Connected with ${peerName}! Meetup point: Block B Foyer.`, "🤝");
  showToast("Peer Connected!", `You are connected with ${peerName}. Check My Requests for status.`, "success");

  // Update requests badge in sidebar
  renderRequests();
}

// ============================================================================
// 7. BOOKING SYSTEM & MODAL
// ============================================================================

let targetBookingResource = null;

function openReservationModal(resourceName = "") {
  targetBookingResource = resourceName || "Lab 204";
  const modal = document.getElementById("bookingModal");
  const title = document.getElementById("bookingResourceName");
  const dateInput = document.getElementById("bookingDate");
  const timeInput = document.getElementById("bookingTime");

  if (title) title.textContent = targetBookingResource;
  if (dateInput) dateInput.value = "Today";
  if (timeInput) timeInput.value = "3:00 PM – 4:00 PM";

  // Reset confirmation screen
  document.getElementById("bookingFormView").style.display = "block";
  document.getElementById("bookingSuccessView").style.display = "none";
  document.getElementById("bookingModalFooter").style.display = "flex";

  if (modal) modal.classList.add("active");
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) modal.classList.remove("active");
}

function confirmBooking() {
  const resourceName = targetBookingResource || "Lab 204";
  const date = document.getElementById("bookingDate").value || "Today";
  const time = document.getElementById("bookingTime").value || "3:00 PM – 4:00 PM";
  const duration = document.getElementById("bookingDuration").value || "1 Hour";
  const purpose = document.getElementById("bookingPurpose").value || "Python Project";

  // Generate unique booking ID (e.g., CC1024)
  const bookingId = "CC" + Math.floor(1000 + Math.random() * 9000);

  // Decrement resource availability count in array
  const res = resourcesData.find(r => r.name.toLowerCase() === resourceName.toLowerCase());
  if (res && res.available > 0) {
    res.available -= 1;
  }

  // Create new Booking object
  const newBooking = new Booking(bookingId, currentStudent.name, resourceName, date, time, duration, purpose, "Confirmed");
  bookingsData.unshift(newBooking);

  // Create tracking request
  const newReq = new CampusRequest(
    `REQ-${Math.floor(100 + Math.random() * 900)}`,
    `${resourceName} Reservation`,
    "Resource Booking",
    null,
    resourceName,
    3 // Matched / Reserved
  );
  requestsData.unshift(newReq);

  // Switch to success view inside modal
  document.getElementById("bookingFormView").style.display = "none";
  document.getElementById("bookingModalFooter").style.display = "none";

  const successView = document.getElementById("bookingSuccessView");
  successView.style.display = "block";
  successView.innerHTML = `
    <div class="confirm-box-success">
      <div class="confirm-icon-check">✓</div>
      <h3 style="font-size: 20px; font-weight: 800; color: #0f172a;">Booking Confirmed!</h3>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Your workspace has been secured.</p>

      <div class="confirm-details-card">
        <div style="font-size: 17px; font-weight: 800; color: #2563eb; margin-bottom: 6px;">${resourceName}</div>
        <div style="font-size: 13px; color: #334155;">📅 ${date} • ⏰ ${time}</div>
        <div style="font-size: 13px; color: #334155; margin-top: 2px;">⏳ Duration: ${duration}</div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
          Booking ID: <strong style="font-family: monospace; color: #0f172a; font-size: 14px;">${bookingId}</strong>
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="closeBookingModal(); switchTab('bookings');">
        View in My Bookings
      </button>
    </div>
  `;

  // Notifications and toasts
  addCampusNotification(`Booking ${bookingId} confirmed for ${resourceName} (${time})`, "✓");
  showToast("Booking Confirmed!", `${resourceName} reserved for ${time}. ID: ${bookingId}`, "success");

  // Re-render UI
  renderResources();
  renderBookings();
  renderRequests();
}

// ============================================================================
// 8. RENDER: PEOPLE DIRECTORY
// ============================================================================

function renderPeople(filter = "all") {
  const container = document.getElementById("peopleGrid");
  if (!container) return;

  const searchVal = (document.getElementById("peopleSearchInput")?.value || "").toLowerCase();

  let list = studentsData.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchVal) ||
                        s.department.toLowerCase().includes(searchVal) ||
                        s.skills.some(sk => sk.toLowerCase().includes(searchVal));
    if (!matchSearch) return false;
    if (filter === "available") return s.availability === "Available";
    return true;
  });

  container.innerHTML = "";

  list.forEach(student => {
    const card = document.createElement("div");
    card.className = "peer-card";

    const isAvail = student.availability === "Available";
    const statusClass = isAvail ? "avail" : "busy";
    const statusText = isAvail ? "🟢 Available now" : `🟡 ${student.availability}`;

    const skillsHtml = student.skills.map(sk => `<span class="skill-pill">${sk}</span>`).join("");

    card.innerHTML = `
      <div class="peer-top">
        <div class="peer-avatar">${student.avatar}</div>
        <div class="peer-info">
          <h4>${student.name}</h4>
          <div class="peer-dept">${student.department} • ${student.semester}</div>
        </div>
      </div>

      <div class="skills-container">
        ${skillsHtml}
      </div>

      <div class="card-meta-row">
        <span class="status-badge-inline ${statusClass}">${statusText}</span>
        <span>📍 ${student.location}</span>
      </div>

      <div class="card-actions-row">
        <button class="btn btn-primary btn-sm" onclick="quickConnectPeer('${student.name}', '${student.skills[0]}')">
          Connect
        </button>
        <button class="btn btn-secondary btn-sm" onclick="viewPeerProfile('${student.name}')">
          Profile
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function quickConnectPeer(name, skill) {
  addCampusNotification(`Request sent to connect with ${name} for ${skill}.`, "🤝");
  showToast("Request Sent", `Notified ${name}. They will respond in <2 mins.`, "success");
}

function viewPeerProfile(name) {
  const student = studentsData.find(s => s.name === name);
  if (!student) return;

  alert(`Student Profile:\nName: ${student.name}\nDepartment: ${student.department} (${student.semester})\nLocation: ${student.location}\nSkills: ${student.skills.join(", ")}\nAvailability: ${student.availability}`);
}

// ============================================================================
// 9. RENDER: RESOURCES DIRECTORY
// ============================================================================

function renderResources(category = "all") {
  const container = document.getElementById("resourcesGrid");
  if (!container) return;

  const searchVal = (document.getElementById("resourceSearchInput")?.value || "").toLowerCase();

  let list = resourcesData.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchVal) ||
                        r.type.toLowerCase().includes(searchVal) ||
                        r.location.toLowerCase().includes(searchVal);
    if (!matchSearch) return false;
    if (category === "labs") return r.type.includes("Lab");
    if (category === "equipment") return r.type.includes("Printer") || r.type.includes("Oscilloscope") || r.type.includes("Studio");
    if (category === "study") return r.type.includes("Study");
    return true;
  });

  container.innerHTML = "";

  list.forEach(res => {
    const card = document.createElement("div");
    card.className = "resource-card";

    const isAvail = res.available > 0 && res.status === "Available";
    const statusClass = isAvail ? "avail" : "busy";
    const statusText = isAvail ? "🟢 Available now" : (res.status === "Busy" ? "🔴 Busy" : "🟠 Maintenance");

    card.innerHTML = `
      <div class="resource-icon-badge">${res.icon}</div>
      <h4>${res.name}</h4>
      <div class="resource-type">${res.type} • 📍 ${res.location}</div>

      <div class="resource-capacity-box">
        <div>
          <div class="capacity-number">${res.available} of ${res.total} free</div>
          <div class="capacity-label">Current availability</div>
        </div>
        <span class="status-badge-inline ${statusClass}">${statusText}</span>
      </div>

      <div class="card-meta-row" style="margin-bottom: 12px; font-size: 11.5px;">
        <span>${res.description}</span>
      </div>

      <div class="card-actions-row">
        <button class="btn btn-primary btn-block btn-sm" ${res.available === 0 ? "disabled" : ""} onclick="openReservationModal('${res.name}')">
          ${res.available === 0 ? "Waitlist" : "Reserve"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// ============================================================================
// 10. RENDER: CAMPUS MAP
// ============================================================================

const campusLocationsData = {
  "Block B": {
    name: "Block B (Computing & Library Wing)",
    distance: "2 min walk (Current building)",
    status: "🟢 High Activity",
    resources: ["Lab 204 (3 systems available)", "Lab 208 (Full)"],
    people: ["Rahul (Python, ML - Available)", "Aditya (Django - In Class)"]
  },
  "Block A": {
    name: "Block A (Core Engineering Wing)",
    distance: "5 min walk across Courtyard",
    status: "🟡 Class in session",
    resources: ["Lab 102 AI Center (0 available)", "Seminar Hall 1"],
    people: ["Ananya (Java, Web - Busy)"]
  },
  "Block C": {
    name: "Block C (Electronics & Circuits)",
    distance: "4 min walk",
    status: "🟢 Labs Open",
    resources: ["Electronics Lab (2 oscilloscopes free)", "AV Recording Studio (1 open)"],
    people: ["Karthik (Arduino, IoT - Available)"]
  },
  "Library": {
    name: "Central Library",
    distance: "3 min walk",
    status: "🟢 Quiet & Open",
    resources: ["Quiet Pod 3 (4 seats free)", "Discussion Room B"],
    people: ["Meera (UI/UX - Available)"]
  },
  "Innovation Lab": {
    name: "Innovation & MakerSpace Center",
    distance: "6 min walk",
    status: "🟢 3D Printers Active",
    resources: ["MakerSpace 3D Hub (1 printer free)", "Laser Cutter"],
    people: ["Sneha (CAD Design - Available)"]
  },
  "Computer Lab": {
    name: "Central Computing Center",
    distance: "3 min walk",
    status: "🟢 Open Workstations",
    resources: ["Lab 204 Workstations", "Cloud Terminal 12"],
    people: ["Rahul", "Aditya"]
  }
};

function selectCampusBlock(blockName) {
  // Highlight card on map
  document.querySelectorAll(".map-block-card").forEach(card => {
    if (card.getAttribute("data-block") === blockName) {
      card.classList.add("active-block");
    } else {
      card.classList.remove("active-block");
    }
  });

  const detail = campusLocationsData[blockName];
  if (!detail) return;

  const panel = document.getElementById("mapDetailsPanel");
  if (!panel) return;

  let resHtml = detail.resources.map(r => `<div class="map-item-row"><span>💻 ${r}</span></div>`).join("");
  let peopleHtml = detail.people.map(p => `<div class="map-item-row"><span>👤 ${p}</span></div>`).join("");

  panel.innerHTML = `
    <div class="map-details-header">
      <h3>${blockName}</h3>
      <div class="map-details-meta">
        <span>📍 ${detail.distance}</span>
        <span>•</span>
        <span>${detail.status}</span>
      </div>
    </div>

    <div class="map-item-group">
      <div class="map-item-group-title">AVAILABLE RESOURCES</div>
      ${resHtml}
    </div>

    <div class="map-item-group">
      <div class="map-item-group-title">ACTIVE PEERS NEARBY</div>
      ${peopleHtml}
    </div>

    <button class="btn btn-primary btn-block btn-sm" style="margin-top: auto;" onclick="handleSmartSearch('Find available resources in ${blockName}')">
      Find in ${blockName}
    </button>
  `;
}

// ============================================================================
// 11. RENDER: MY REQUESTS (5-Step Progress Timeline)
// ============================================================================

function renderRequests() {
  const container = document.getElementById("requestsListContainer");
  if (!container) return;

  container.innerHTML = "";

  if (requestsData.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 40px;">No active requests. Use the search box to find peers or equipment!</div>`;
    return;
  }

  requestsData.forEach(req => {
    const card = document.createElement("div");
    card.className = "request-card";

    // Build the 5-step timeline
    // 1: Request Created, 2: Requirement Understood, 3: Match Found, 4: Connected, 5: Completed
    const steps = [
      { num: 1, title: "Request<br>Created" },
      { num: 2, title: "Requirement<br>Understood" },
      { num: 3, title: "Match<br>Found" },
      { num: 4, title: "Connected" },
      { num: 5, title: "Completed" }
    ];

    let stepsHtml = "";
    steps.forEach(st => {
      let stateClass = "";
      let icon = st.num;
      if (req.step > st.num) {
        stateClass = "completed";
        icon = "✓";
      } else if (req.step === st.num) {
        stateClass = "active";
      }

      stepsHtml += `
        <div class="timeline-step ${stateClass}">
          <div class="step-node">${icon}</div>
          <div class="step-label">${st.title}</div>
        </div>
      `;
    });

    const statusBadge = req.step === 5 
      ? '<span class="status-badge-inline avail">✓ Completed</span>'
      : (req.step >= 4 ? '<span class="status-badge-inline avail">🟢 Matched & Connected</span>' : '<span class="status-badge-inline" style="color: #f59e0b;">🟡 Reserved</span>');

    card.innerHTML = `
      <div class="request-card-top">
        <div class="request-title-area">
          <h3>${req.title}</h3>
          <div class="request-time">Request ID: ${req.id} • ${req.timestamp}</div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div class="timeline-stepper">
        ${stepsHtml}
      </div>

      <div class="request-meta-details">
        <div style="font-size: 13px; color: #64748b;">
          ${req.targetPerson ? `<strong>Peer:</strong> ${req.targetPerson}` : ""} 
          ${req.targetResource ? `• <strong>Resource:</strong> ${req.targetResource}` : ""}
        </div>
        <div style="display: flex; gap: 8px;">
          ${req.step < 5 ? `<button class="btn btn-secondary btn-sm" onclick="advanceRequest('${req.id}')">Advance Step</button>` : ""}
          <button class="btn btn-primary btn-sm" onclick="showToast('Campus Chat', 'Opening quick message channel with peer...', 'primary')">Message</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function advanceRequest(reqId) {
  const req = requestsData.find(r => r.id === reqId);
  if (req && req.step < 5) {
    req.step += 1;
    if (req.step === 5) req.status = "Completed";
    renderRequests();
    showToast("Request Updated", `Progress updated for ${req.title}`, "success");
  }
}

// ============================================================================
// 12. RENDER: BOOKINGS TAB
// ============================================================================

function renderBookings() {
  const container = document.getElementById("bookingsGridContainer");
  if (!container) return;

  container.innerHTML = "";

  if (bookingsData.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px;">No bookings found. Click [Reserve] on any resource to reserve a workspace.</div>`;
    return;
  }

  bookingsData.forEach(b => {
    const card = document.createElement("div");
    card.className = "booking-card";

    const isConf = b.status === "Confirmed";
    const statusBadge = isConf ? '<span class="status-badge-inline avail">🟢 Confirmed</span>' : '<span class="status-badge-inline" style="color: #64748b;">✓ Finished</span>';

    card.innerHTML = `
      <div class="booking-card-header">
        <span class="booking-id-tag">${b.id}</span>
        ${statusBadge}
      </div>
      <h4>${b.resourceName}</h4>
      <div class="booking-info-row">📅 Date: <strong>${b.date}</strong></div>
      <div class="booking-info-row">⏰ Time: <strong>${b.time}</strong> (${b.duration})</div>
      <div class="booking-info-row">🎯 Purpose: ${b.purpose}</div>

      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
        <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="cancelBooking('${b.id}')">Cancel</button>
        <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="showToast('Check-in Ready', 'Show Booking ID ${b.id} at lab counter.', 'success')">Check In</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function cancelBooking(bookingId) {
  const idx = bookingsData.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    const b = bookingsData[idx];
    // Return unit count back to resource
    const res = resourcesData.find(r => r.name.toLowerCase() === b.resourceName.toLowerCase());
    if (res) res.available = Math.min(res.total, res.available + 1);

    bookingsData.splice(idx, 1);
    renderBookings();
    renderResources();
    showToast("Booking Cancelled", `Booking ${bookingId} has been released.`, "warning");
  }
}

// ============================================================================
// 13. RENDER: NOTIFICATIONS TAB
// ============================================================================

function renderNotifications() {
  const container = document.getElementById("notificationsListContainer");
  if (!container) return;

  container.innerHTML = "";

  notificationsData.forEach(n => {
    const item = document.createElement("div");
    item.className = `notification-item ${n.unread ? 'unread' : ''}`;
    item.innerHTML = `
      <div class="notif-icon-box">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    `;
    container.appendChild(item);
  });

  updateNotificationBadges();
}

function markAllNotificationsRead() {
  notificationsData.forEach(n => n.unread = false);
  renderNotifications();
  showToast("Notifications", "All marked as read", "primary");
}

// ============================================================================
// 14. RENDER: STUDENT PROFILE
// ============================================================================

function renderProfile() {
  document.getElementById("profileName").textContent = currentStudent.name;
  document.getElementById("profileId").textContent = currentStudent.id;
  document.getElementById("profileDept").textContent = currentStudent.department;
  document.getElementById("profileSem").textContent = currentStudent.semester;
  document.getElementById("profileLocation").textContent = currentStudent.location;
  document.getElementById("profileAvail").textContent = currentStudent.availability;

  const skillsContainer = document.getElementById("profileSkillsContainer");
  if (skillsContainer) {
    skillsContainer.innerHTML = currentStudent.skills
      .map(sk => `<span class="skill-pill" style="font-size: 13px; padding: 6px 12px; margin: 3px;">${sk}</span>`)
      .join("");
  }
}

function addStudentSkill() {
  const input = document.getElementById("newSkillInput");
  const skill = input ? input.value.trim() : "";
  if (!skill) return;

  if (!currentStudent.skills.includes(skill)) {
    currentStudent.skills.push(skill);
    // Also add to global studentsData for matching
    const meInStudents = studentsData.find(s => s.name === currentStudent.name);
    if (meInStudents) {
      meInStudents.skills.push(skill);
    }
    input.value = "";
    renderProfile();
    showToast("Skill Added!", `"${skill}" added to your helper profile.`, "success");
    addCampusNotification(`You are now discoverable for ${skill} peer assistance!`, "🌟");
  }
}

function toggleMyAvailability() {
  if (currentStudent.availability === "Available") {
    currentStudent.availability = "Busy";
  } else {
    currentStudent.availability = "Available";
  }
  const meInStudents = studentsData.find(s => s.name === currentStudent.name);
  if (meInStudents) meInStudents.availability = currentStudent.availability;

  renderProfile();
  showToast("Status Updated", `Your availability is now set to ${currentStudent.availability}`, "primary");
}

// ============================================================================
// 15. RENDER: ADMIN DASHBOARD
// ============================================================================

function renderAdmin() {
  const totalStudents = 250;
  const availableRes = resourcesData.reduce((acc, r) => acc + r.available, 0);
  const activeReqs = requestsData.filter(r => r.step < 5).length + 16;
  const todayBookings = bookingsData.length + 44;

  const elStudents = document.getElementById("adminTotalStudents");
  const elRes = document.getElementById("adminAvailableRes");
  const elReqs = document.getElementById("adminActiveReqs");
  const elBookings = document.getElementById("adminTodayBookings");

  if (elStudents) elStudents.textContent = totalStudents;
  if (elRes) elRes.textContent = availableRes;
  if (elReqs) elReqs.textContent = activeReqs;
  if (elBookings) elBookings.textContent = todayBookings;

  // Skills Demand Chart
  const skillsDemand = [
    { name: "Python", count: 42, max: 50 },
    { name: "Java", count: 31, max: 50 },
    { name: "Web Development", count: 24, max: 50 },
    { name: "Machine Learning", count: 19, max: 50 },
    { name: "Hardware & IoT", count: 15, max: 50 }
  ];

  const chartContainer = document.getElementById("adminSkillsChart");
  if (chartContainer) {
    chartContainer.innerHTML = skillsDemand.map(s => `
      <div class="skill-stat-bar-row">
        <div class="skill-stat-info">
          <span>${s.name}</span>
          <span style="color: #2563eb; font-weight: 700;">${s.count} requests</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" style="width: ${(s.count / s.max) * 100}%"></div>
        </div>
      </div>
    `).join("");
  }
}

// ============================================================================
// 16. RENDER: RESOURCE OWNER / FACULTY PAGE
// ============================================================================

function renderOwner() {
  const tableBody = document.getElementById("ownerResourcesTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  resourcesData.forEach(r => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${r.name}</strong><br><span style="font-size: 11px; color: #64748b;">${r.type}</span></td>
      <td>${r.location}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="owner-counter-btn" onclick="adjustResourceCount(${r.id}, -1)">-</button>
          <strong style="min-width: 20px; text-align: center;">${r.available}</strong>
          <button class="owner-counter-btn" onclick="adjustResourceCount(${r.id}, 1)">+</button>
          <span style="color: #64748b; font-size: 12px;">/ ${r.total}</span>
        </div>
      </td>
      <td>
        <button class="btn btn-sm ${r.status === 'Available' ? 'btn-success' : 'btn-secondary'}" onclick="toggleResourceStatus(${r.id})">
          ${r.status}
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

function adjustResourceCount(id, delta) {
  const res = resourcesData.find(r => r.id === id);
  if (res) {
    res.available = Math.max(0, Math.min(res.total, res.available + delta));
    renderOwner();
    renderResources();
    showToast("Updated", `${res.name} availability set to ${res.available}`, "primary");
  }
}

function toggleResourceStatus(id) {
  const res = resourcesData.find(r => r.id === id);
  if (res) {
    res.status = res.status === "Available" ? "Maintenance" : "Available";
    renderOwner();
    renderResources();
    showToast("Status Changed", `${res.name} is now ${res.status}`, "primary");
  }
}

function handleAddResource(e) {
  e.preventDefault();
  const name = document.getElementById("newResName").value.trim();
  const type = document.getElementById("newResType").value.trim();
  const total = parseInt(document.getElementById("newResTotal").value, 10) || 5;
  const location = document.getElementById("newResLocation").value.trim();

  if (!name || !type) return;

  const newRes = new Resource(
    Date.now(),
    name,
    type,
    total,
    total,
    location,
    "Available",
    "💻",
    "Newly added by faculty coordinator"
  );

  resourcesData.push(newRes);
  e.target.reset();
  renderOwner();
  renderResources();
  showToast("Resource Added", `${name} is now open for students!`, "success");
}

// ============================================================================
// 17. REAL-TIME AVAILABILITY SIMULATION
// ============================================================================

/**
 * Simulates real-time fluctuating availability across campus resources
 * Demonstrates live coordination across campus in real time!
 */
function startLivePulseSimulation() {
  if (livePulseInterval) clearInterval(livePulseInterval);

  livePulseInterval = setInterval(() => {
    // Pick a random resource (especially Lab 204)
    const target = resourcesData[0]; // Lab 204
    if (!target) return;

    // Shift count slightly between 2, 3, and 4
    const deltas = [-1, 1];
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const newCount = target.available + delta;

    if (newCount >= 1 && newCount <= 5) {
      target.available = newCount;
      
      // Update badge if on resources or dashboard
      const pulseCountEl = document.getElementById("pulseLab204Count");
      if (pulseCountEl) pulseCountEl.textContent = `${target.available} systems available`;

      // Update ticker badge
      const pulseText = document.getElementById("livePulseText");
      if (pulseText) {
        pulseText.textContent = `Lab 204: ${target.available} systems free`;
      }
    }
  }, 6000);
}

// ============================================================================
// 18. AUTHENTICATION & LOGIN FLOW
// ============================================================================

function handleLogin(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById("loginName");
  const idInput = document.getElementById("loginId");
  const deptInput = document.getElementById("loginDept");
  const semInput = document.getElementById("loginSem");

  const name = nameInput ? nameInput.value.trim() : "";
  const id = idInput ? idInput.value.trim() : "";
  const dept = deptInput ? deptInput.value.trim() : "";
  const sem = semInput ? semInput.value.trim() : "";

  // Simple beginner-friendly validation
  if (!name || !id) {
    showToast("Incomplete Form", "Please enter your Name and Student ID.", "warning");
    return;
  }

  // Update currentStudent state
  currentStudent.name = name;
  currentStudent.id = id;
  currentStudent.department = dept || "ISE";
  currentStudent.semester = sem || "4th Semester";

  // Hide login view, show app shell
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appShell").style.display = "flex";

  // Update user info across top bar & sidebar
  document.getElementById("topStudentName").textContent = currentStudent.name.split(" ")[0];
  document.getElementById("sidebarStudentName").textContent = currentStudent.name;
  document.getElementById("sidebarStudentDept").textContent = `${currentStudent.department} • ${currentStudent.semester}`;

  showToast("Welcome!", `Logged in as ${currentStudent.name}`, "success");

  // Load default dashboard tab
  switchTab("dashboard");
  startLivePulseSimulation();
}

function handleQuickDemoLogin() {
  document.getElementById("loginName").value = "Priya Sharma";
  document.getElementById("loginId").value = "CS2024042";
  document.getElementById("loginDept").value = "ISE";
  document.getElementById("loginSem").value = "4th Semester";
  handleLogin();
}

function handleLogout() {
  document.getElementById("appShell").style.display = "none";
  document.getElementById("loginView").style.display = "flex";
  showToast("Logged Out", "You have been logged out safely.", "primary");
}

// ============================================================================
// 19. INITIALIZATION & EVENT LISTENERS
// ============================================================================

window.addEventListener("DOMContentLoaded", () => {
  // Bind Login Form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // Bind Smart Search Input Enter Key
  const searchInput = document.getElementById("smartSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSmartSearch();
    });
  }

  // Bind Quick Actions buttons
  const quickActions = document.querySelectorAll(".action-pill-btn");
  quickActions.forEach(btn => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) handleSmartSearch(prompt);
    });
  });

  // Bind Search Filter Inputs
  const pInput = document.getElementById("peopleSearchInput");
  if (pInput) pInput.addEventListener("input", () => renderPeople());

  const rInput = document.getElementById("resourceSearchInput");
  if (rInput) rInput.addEventListener("input", () => renderResources());

  // Bind Owner Form
  const ownerForm = document.getElementById("newResourceForm");
  if (ownerForm) ownerForm.addEventListener("submit", handleAddResource);

  // Initial renders
  renderPeople();
  renderResources();
  renderRequests();
  renderBookings();
  renderNotifications();
  renderAdmin();
  renderOwner();
  renderProfile();
  selectCampusBlock("Block B");
});
