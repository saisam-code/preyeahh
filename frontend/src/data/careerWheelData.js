import {
  FaLaptopCode,
  FaHeartPulse,
  FaPalette,
  FaBriefcase,
  FaMicroscope,
  FaScaleBalanced,
  FaBookOpen,
  FaDumbbell,
  FaSeedling,
  FaWrench,
  FaPlaneDeparture,
  FaRocket,
} from "react-icons/fa6";

export const CAREER_DOMAINS = [
  {
    id: "tech-eng",
    title: "Technology & Engineering",
    shortTitle: "Tech & Engineering",
    icon: FaLaptopCode,
    color: "#2563eb", // Vibrant Blue
    bgLight: "rgba(37, 99, 235, 0.08)",
    description: "Build software, design intelligent systems, architecture, and shape the digital world.",
    careers: [
      { name: "Software Engineer", desc: "Design and build web, mobile, and cloud software systems." },
      { name: "AI / ML Specialist", desc: "Train neural networks and develop predictive intelligence models." },
      { name: "Cybersecurity Analyst", desc: "Protect organizational networks and defend against digital threats." },
      { name: "Robotics Engineer", desc: "Create autonomous hardware-software robotic mechanisms." },
    ],
    specializations: ["Cloud Architecture", "Full-Stack Web", "Embedded Systems", "Data Engineering"],
  },
  {
    id: "med-health",
    title: "Medicine & Healthcare",
    shortTitle: "Healthcare",
    icon: FaHeartPulse,
    color: "#e11d48", // Crimson Rose
    bgLight: "rgba(225, 29, 72, 0.08)",
    description: "Heal lives, study disease mechanisms, and improve physical and mental human well-being.",
    careers: [
      { name: "Physician / Doctor", desc: "Diagnose, treat, and heal patients in specialized medical branches." },
      { name: "Biomedical Scientist", desc: "Research medical breakthroughs, diagnostics, and treatments." },
      { name: "Clinical Psychologist", desc: "Provide evidence-based therapy and mental healthcare." },
      { name: "Public Health Officer", desc: "Design healthcare access strategies and epidemiologic solutions." },
    ],
    specializations: ["Surgery", "Neurobiology", "Pharmacology", "Pediatrics"],
  },
  {
    id: "arts-media",
    title: "Arts, Design & Media",
    shortTitle: "Arts & Media",
    icon: FaPalette,
    color: "#9333ea", // Purple Violet
    bgLight: "rgba(147, 51, 234, 0.08)",
    description: "Express stories through visual design, cinema, sound, digital illustration, and media.",
    careers: [
      { name: "UI/UX Designer", desc: "Craft intuitive, accessible digital interfaces and products." },
      { name: "Filmmaker / Director", desc: "Direct cinematic narratives, documentaries, and visual media." },
      { name: "Digital Animator", desc: "Create 2D/3D characters, visual effects, and gaming assets." },
      { name: "Sound Designer", desc: "Engineer audio environments, mixing, and music composition." },
    ],
    specializations: ["Design Systems", "Cinematography", "Motion Graphics", "Creative Direction"],
  },
  {
    id: "business-ent",
    title: "Business & Entrepreneurship",
    shortTitle: "Business",
    icon: FaBriefcase,
    color: "#d97706", // Amber
    bgLight: "rgba(217, 119, 6, 0.08)",
    description: "Launch innovative ventures, drive financial growth, lead teams, and scale global organizations.",
    careers: [
      { name: "Startup Founder", desc: "Identify market opportunities and build high-growth businesses." },
      { name: "Product Manager", desc: "Guide cross-functional teams to build market-defining products." },
      { name: "Financial Analyst", desc: "Evaluate corporate investments, assets, and valuation models." },
      { name: "Marketing Strategist", desc: "Drive brand adoption, customer acquisition, and campaign strategy." },
    ],
    specializations: ["Venture Capital", "Growth Strategy", "Fintech", "Operations"],
  },
  {
    id: "science-res",
    title: "Science & Research",
    shortTitle: "Science & Research",
    icon: FaMicroscope,
    color: "#0891b2", // Cyan
    bgLight: "rgba(8, 145, 178, 0.08)",
    description: "Investigate cosmic mysteries, molecular physics, genetics, and fundamental scientific truths.",
    careers: [
      { name: "Astrophysicist", desc: "Study cosmological bodies, gravitational fields, and space missions." },
      { name: "Geneticist", desc: "Analyze DNA sequencing, gene therapy, and biological inheritance." },
      { name: "Quantum Physicist", desc: "Research subatomic particles and quantum computing principles." },
      { name: "Data Scientist", desc: "Extract scientific insights and patterns from large datasets." },
    ],
    specializations: ["Quantum Mechanics", "Bioinformatics", "Materials Science", "Nanotechnology"],
  },
  {
    id: "law-public",
    title: "Law & Public Services",
    shortTitle: "Law & Public",
    icon: FaScaleBalanced,
    color: "#475569", // Slate
    bgLight: "rgba(71, 85, 105, 0.08)",
    description: "Uphold justice, craft public policy, defend civil rights, and govern societal institutions.",
    careers: [
      { name: "Corporate Lawyer", desc: "Navigate contracts, mergers, intellectual property, and compliance." },
      { name: "Civil Services Officer", desc: "Lead administrative districts, departments, and government policies." },
      { name: "Human Rights Advocate", desc: "Defend public interest and constitutional civil liberties." },
      { name: "Public Policy Analyst", desc: "Draft legislative research and regulatory frameworks." },
    ],
    specializations: ["Constitutional Law", "Tech Policy", "International Relations", "Litigation"],
  },
  {
    id: "edu-psych",
    title: "Education & Psychology",
    shortTitle: "Education",
    icon: FaBookOpen,
    color: "#ea580c", // Orange
    bgLight: "rgba(234, 88, 12, 0.08)",
    description: "Inspire next generations, design pedagogical innovations, and explore human cognition.",
    careers: [
      { name: "Professor / Lecturer", desc: "Teach specialized academic disciplines and publish research." },
      { name: "Instructional Designer", desc: "Architect modern curriculum and interactive learning systems." },
      { name: "Cognitive Scientist", desc: "Study memory, neural perception, and decision mechanisms." },
      { name: "Career Counsellor", desc: "Guide students toward fulfilling pathways and opportunities." },
    ],
    specializations: ["EdTech", "Behavioral Psychology", "Curriculum Design", "STEM Pedagogy"],
  },
  {
    id: "sports-fit",
    title: "Sports & Fitness",
    shortTitle: "Sports & Fitness",
    icon: FaDumbbell,
    color: "#16a34a", // Vibrant Green
    bgLight: "rgba(22, 163, 74, 0.08)",
    description: "Excel in athletic performance, sports analytics, biomechanics, and physical coaching.",
    careers: [
      { name: "Professional Athlete", desc: "Compete at national and international competitive sporting levels." },
      { name: "Sports Physiotherapist", desc: "Prevent and rehabilitate sports injuries and enhance recovery." },
      { name: "Performance Coach", desc: "Develop high-performance training and athletic conditioning." },
      { name: "Sports Data Analyst", desc: "Extract tactical game insights and statistical performance." },
    ],
    specializations: ["Biomechanics", "Sports Nutrition", "Kinesiology", "Tactical Coaching"],
  },
  {
    id: "agri-env",
    title: "Agriculture & Environment",
    shortTitle: "Agriculture & Env",
    icon: FaSeedling,
    color: "#65a30d", // Lime Green
    bgLight: "rgba(101, 163, 13, 0.08)",
    description: "Sustain planetary ecosystems, advance regenerative agriculture, and fight climate change.",
    careers: [
      { name: "Agritech Specialist", desc: "Deploy IoT, drones, and precision technology in agriculture." },
      { name: "Environmental Scientist", desc: "Protect natural habitats, clean water, and conservation areas." },
      { name: "Renewable Energy Engineer", desc: "Design solar, wind, and sustainable power infrastructures." },
      { name: "Wildlife Biologist", desc: "Track species biodiversity, ecosystems, and conservation." },
    ],
    specializations: ["Precision Farming", "Hydrology", "Forest Ecology", "Carbon Accounting"],
  },
  {
    id: "trades-voc",
    title: "Skilled Trades & Vocational",
    shortTitle: "Skilled Trades",
    icon: FaWrench,
    color: "#b45309", // Warm Ochre
    bgLight: "rgba(180, 83, 9, 0.08)",
    description: "Master craft expertise, precision engineering, architectural builds, and technical mastery.",
    careers: [
      { name: "Precision CNC Machinist", desc: "Fabricate aerospace-grade metal and precision mechanisms." },
      { name: "Automotive Specialist", desc: "Service and optimize electric vehicle and combustion systems." },
      { name: "Electrical Master", desc: "Install high-voltage, industrial, and smart automation systems." },
      { name: "HVAC & Energy Specialist", desc: "Install building climate control and industrial energy systems." },
    ],
    specializations: ["EV Diagnostics", "Industrial Robotics", "Smart Automation", "Welding Arts"],
  },
  {
    id: "aviation-def",
    title: "Aviation & Defence",
    shortTitle: "Aviation & Defence",
    icon: FaPlaneDeparture,
    color: "#0369a1", // Sky Blue
    bgLight: "rgba(3, 105, 161, 0.08)",
    description: "Pilot commercial aircraft, navigate flight operations, aerospace engineering, and national security.",
    careers: [
      { name: "Commercial Pilot", desc: "Fly passenger and cargo aircraft across global routes." },
      { name: "Air Traffic Controller", desc: "Coordinate airspace safety, departures, and landings." },
      { name: "Aerospace Systems Engineer", desc: "Design aircraft fuselages, avionics, and jet engines." },
      { name: "Defence Technology Specialist", desc: "Develop tactical communications, radar, and security systems." },
    ],
    specializations: ["Avionics", "Flight Operations", "UAV / Drones", "Navigation Systems"],
  },
  {
    id: "emerging-unconv",
    title: "Emerging & Unconventional",
    shortTitle: "Emerging & Creative",
    icon: FaRocket,
    color: "#db2777", // Fuchsia Pink
    bgLight: "rgba(219, 39, 119, 0.08)",
    description: "Pioneer new frontiers in content creation, esports, metaverse, culinary arts, and web3.",
    careers: [
      { name: "Content Creator / Streamer", desc: "Build independent media brands and digital communities." },
      { name: "Game Developer", desc: "Code interactive gameplay, physics, and gaming mechanics." },
      { name: "Executive Chef / Gastronomist", desc: "Create culinary artistry, restaurant ventures, and food science." },
      { name: "Ethical Hacker", desc: "Perform penetration testing to protect systems from intrusion." },
    ],
    specializations: ["Esports Strategy", "Culinary Science", "Game Mechanics", "Virtual Reality"],
  },
];
