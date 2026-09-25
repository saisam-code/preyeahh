import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import mongoose from "mongoose";
import Resource from "../models/Resource.js";

const seedData = [
  // JavaScript — all branches can benefit
  { title: "JavaScript Info", description: "The Modern JavaScript Tutorial — most comprehensive free JS resource.", type: "documentation", url: "https://javascript.info/", provider: "Ilya Kantor", technology: "javascript", category: "frontend", tags: ["es6", "dom", "functions", "basics"], difficulty: "all", branches: [], isCurated: true },
  { title: "JavaScript Crash Course", description: "Learn JS basics fast — variables, functions, DOM.", type: "video", url: "https://www.youtube.com/watch?v=hdI2bqOjy3c", provider: "Traversy Media", technology: "javascript", category: "frontend", tags: ["basics", "syntax", "beginner"], difficulty: "beginner", branches: [], isCurated: true },
  { title: "Eloquent JavaScript", description: "Deep dive into JS — functions, closures, async.", type: "book", url: "https://eloquentjavascript.net/", provider: "Marijn Haverbeke", technology: "javascript", category: "frontend", tags: ["book", "deep dive", "fundamentals"], difficulty: "intermediate", branches: [], isCurated: true },

  // Python
  { title: "Learn Python - Full Course", description: "Comprehensive Python course for beginners.", type: "video", url: "https://www.youtube.com/watch?v=rfscVS0vtbw", provider: "FreeCodeCamp", technology: "python", category: "backend", tags: ["intro", "programming", "basics"], difficulty: "beginner", branches: ["CSE", "ECE", "EEE"], isCurated: true },
  { title: "Python Official Documentation", description: "The official Python docs and standard library reference.", type: "documentation", url: "https://docs.python.org/3/", provider: "Python Foundation", technology: "python", category: "backend", tags: ["reference", "standard library"], difficulty: "all", branches: [], isCurated: true },
  { title: "Python OOP Tutorial", description: "Object Oriented Programming in Python — classes, inheritance.", type: "video", url: "https://www.youtube.com/watch?v=JeznW_7DlB0", provider: "Corey Schafer", technology: "python", category: "backend", tags: ["oop", "classes", "intermediate"], difficulty: "intermediate", branches: [], isCurated: true },

  // C & C++ — core for ECE, EEE, MECH, CIVIL
  { title: "C Programming Full Course", description: "Complete C programming from scratch.", type: "video", url: "https://www.youtube.com/watch?v=KJgsSFOSQv0", provider: "FreeCodeCamp", technology: "c", category: "programming", tags: ["basics", "pointers", "memory"], difficulty: "beginner", branches: ["CSE", "ECE", "EEE", "MECH", "CIVIL"], isCurated: true },
  { title: "C++ Full Course", description: "C++ for beginners to intermediate.", type: "video", url: "https://www.youtube.com/watch?v=vLnPwxZdW4Y", provider: "FreeCodeCamp", technology: "c++", category: "programming", tags: ["oop", "stl", "basics"], difficulty: "beginner", branches: ["CSE", "ECE", "EEE", "MECH"], isCurated: true },

  // Data Structures & Algorithms
  { title: "DSA Full Course", description: "Data structures and algorithms in Python.", type: "video", url: "https://www.youtube.com/watch?v=pkYVOmU3MgA", provider: "FreeCodeCamp", technology: "dsa", category: "computer science", tags: ["arrays", "trees", "graphs", "sorting"], difficulty: "intermediate", branches: ["CSE", "ECE"], isCurated: true },
  { title: "LeetCode Practice", description: "Practice DSA problems — essential for placements.", type: "practice", url: "https://leetcode.com/", provider: "LeetCode", technology: "dsa", category: "computer science", tags: ["practice", "interview", "problems"], difficulty: "intermediate", branches: ["CSE", "ECE"], isCurated: true },

  // React
  { title: "React Official Documentation", description: "The definitive React learning resource.", type: "documentation", url: "https://react.dev/", provider: "React", technology: "react", category: "frontend", tags: ["basics", "hooks", "components", "jsx"], difficulty: "all", branches: ["CSE"], isCurated: true },
  { title: "React Course - Beginner", description: "Full React Course for Beginners — hooks, state, props.", type: "video", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", provider: "FreeCodeCamp", technology: "react", category: "frontend", tags: ["tutorial", "hooks", "basics"], difficulty: "beginner", branches: ["CSE"], isCurated: true },

  // Node.js
  { title: "Node.js Crash Course", description: "Fundamentals of Node.js — modules, file system, HTTP.", type: "video", url: "https://www.youtube.com/watch?v=fBNz5xF-Kx4", provider: "Traversy Media", technology: "node.js", category: "backend", tags: ["intro", "api", "server"], difficulty: "beginner", branches: ["CSE"], isCurated: true },
  { title: "Node.js Official Docs", description: "Node.js reference documentation.", type: "documentation", url: "https://nodejs.org/en/docs/", provider: "Node.js", technology: "node.js", category: "backend", tags: ["reference", "api"], difficulty: "intermediate", branches: ["CSE"], isCurated: true },

  // MongoDB
  { title: "MongoDB Crash Course", description: "Learn NoSQL database basics with Mongoose.", type: "video", url: "https://www.youtube.com/watch?v=-56x56UppqQ", provider: "Traversy Media", technology: "mongodb", category: "database", tags: ["nosql", "database", "mongoose"], difficulty: "beginner", branches: ["CSE"], isCurated: true },

  // Machine Learning / Data Science — CSE, ECE
  { title: "Machine Learning for Everybody", description: "ML basics with Python — regression, classification.", type: "video", url: "https://www.youtube.com/watch?v=i_LwzRmA_08", provider: "FreeCodeCamp", technology: "machine learning", category: "ai", tags: ["python", "data science", "regression"], difficulty: "beginner", branches: ["CSE", "ECE"], isCurated: true },
  { title: "TensorFlow Documentation", description: "End-to-end open source ML platform.", type: "documentation", url: "https://www.tensorflow.org/learn", provider: "Google", technology: "tensorflow", category: "ai", tags: ["deep learning", "neural networks"], difficulty: "advanced", branches: ["CSE", "ECE"], isCurated: true },

  // Embedded Systems — ECE, EEE
  { title: "Arduino Programming Full Course", description: "Learn embedded systems with Arduino.", type: "video", url: "https://www.youtube.com/watch?v=zJ-LqeX_fLU", provider: "FreeCodeCamp", technology: "arduino", category: "embedded", tags: ["microcontroller", "iot", "c"], difficulty: "beginner", branches: ["ECE", "EEE"], isCurated: true },
  { title: "Raspberry Pi Beginner Guide", description: "Get started with Raspberry Pi — GPIO, Python.", type: "article", url: "https://www.raspberrypi.org/documentation/", provider: "Raspberry Pi Foundation", technology: "raspberry pi", category: "embedded", tags: ["iot", "linux", "python"], difficulty: "beginner", branches: ["ECE", "EEE"], isCurated: true },

  // Electrical — EEE
  { title: "Circuit Theory Full Course", description: "Basic circuit theory — Ohm's law, Kirchhoff's laws.", type: "video", url: "https://www.youtube.com/watch?v=mc979OhitAg", provider: "The Organic Chemistry Tutor", technology: "circuit theory", category: "electrical", tags: ["circuits", "ohms law", "basics"], difficulty: "beginner", branches: ["EEE", "ECE"], isCurated: true },

  // CAD/Mechanical — MECH
  { title: "AutoCAD for Beginners", description: "Learn 2D drafting and design in AutoCAD.", type: "video", url: "https://www.youtube.com/watch?v=lZWYELCv5Yg", provider: "CAD in Black", technology: "autocad", category: "design", tags: ["drafting", "2d", "engineering drawing"], difficulty: "beginner", branches: ["MECH", "CIVIL"], isCurated: true },
  { title: "SolidWorks Beginner Tutorial", description: "3D modeling fundamentals in SolidWorks.", type: "video", url: "https://www.youtube.com/watch?v=OBvdCuCAt28", provider: "SolidWorks", technology: "solidworks", category: "cad", tags: ["3d modeling", "parts", "assembly"], difficulty: "beginner", branches: ["MECH"], isCurated: true },

  // Civil
  { title: "AutoCAD Civil 3D Basics", description: "Civil engineering design using AutoCAD Civil 3D.", type: "video", url: "https://www.youtube.com/watch?v=n4r3v3Ed6oA", provider: "Autodesk", technology: "civil 3d", category: "civil engineering", tags: ["surveying", "roads", "grading"], difficulty: "beginner", branches: ["CIVIL"], isCurated: true },
  { title: "Structural Analysis Basics", description: "Introduction to structural analysis — beams, frames.", type: "video", url: "https://www.youtube.com/watch?v=TvRTiOVlXMs", provider: "Dr. Structure", technology: "structural analysis", category: "civil engineering", tags: ["structures", "loads", "beams"], difficulty: "beginner", branches: ["CIVIL"], isCurated: true },

  // Git — all branches
  { title: "Git and GitHub for Beginners", description: "Version control crash course — commits, branches, PRs.", type: "video", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", provider: "FreeCodeCamp", technology: "git", category: "devops", tags: ["version control", "collaboration", "github"], difficulty: "beginner", branches: [], isCurated: true },

  // SQL — all branches
  { title: "SQL Tutorial - Full Database Course", description: "Learn SQL from scratch — queries, joins, indexes.", type: "video", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY", provider: "FreeCodeCamp", technology: "sql", category: "database", tags: ["relational", "queries", "joins"], difficulty: "beginner", branches: [], isCurated: true },

  // TypeScript — CSE
  { title: "TypeScript Crash Course", description: "Static typing for JavaScript — interfaces, generics.", type: "video", url: "https://www.youtube.com/watch?v=BCg4U1FzODs", provider: "Traversy Media", technology: "typescript", category: "frontend", tags: ["types", "interfaces", "javascript"], difficulty: "intermediate", branches: ["CSE"], isCurated: true },

  // Docker — CSE
  { title: "Docker Tutorial for Beginners", description: "Containers, images, and deployment basics.", type: "video", url: "https://www.youtube.com/watch?v=pTFZFxd4hOI", provider: "TechWorld with Nana", technology: "docker", category: "devops", tags: ["containers", "deployment", "devops"], difficulty: "beginner", branches: ["CSE"], isCurated: true },

  // HTML/CSS — CSE
  { title: "MDN Web Docs: HTML", description: "Ultimate reference for HTML elements and attributes.", type: "documentation", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", provider: "Mozilla", technology: "html", category: "frontend", tags: ["web", "basics", "markup"], difficulty: "beginner", branches: ["CSE"], isCurated: true },
  { title: "CSS Tricks", description: "Tips, tricks, and techniques on CSS — flexbox, grid.", type: "article", url: "https://css-tricks.com/", provider: "CSS Tricks", technology: "css", category: "frontend", tags: ["styling", "flexbox", "grid", "layout"], difficulty: "intermediate", branches: ["CSE"], isCurated: true },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/preyeah";

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    console.log("Clearing existing resources...");
    await Resource.deleteMany();

    console.log("Inserting seed data...");
    await Resource.insertMany(seedData);

    console.log(`Successfully inserted ${seedData.length} resources.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

seedDB();