import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app/";

// Hardcoded data for faculty from Excel sheet (first 20 faculty members)
const FACULTY_DATA = {
  "bakulparekh55@gmail.com": {
    facultyName: "Bakul Parikh",
    email: "bakulparekh55@gmail.com",
    sessions: [
      {
        title: "Between Guidelines and Ground Reality: Talking to Families in Indian PICUs",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Puneet Pooni, Dr. Nirmal Choraria, Dr. Hariharan Seetharaman, Dr. Kwame Boateng"
      }
    ]
  },
  "bmdoc2002@rediffmail.com": {
    facultyName: "Bal Mukund",
    email: "bmdoc2002@rediffmail.com",
    sessions: [
      {
        title: "Hemorrhage Control in Polytrauma: Precision in Pressure, Clotting & Care",
        date: "9/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "mdpicu@hotmail.com": {
    facultyName: "Bala Ramachandaran",
    email: "mdpicu@hotmail.com",
    sessions: [
      {
        title: "Breathless Battles: Viral Pneumonia That Won't Back Down: What's the Trend in Pediatric Viral Pneumonia?",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Manish Sharma (Moderator), Panelists, Dr. Anil Sachdeva, Dr. Hiroshi Kurosawa, Dr. Ranganath Iyer"
      },
      {
        title: "Burnout in PICU: Caring for the Caring Team",
        date: "9/11",
        role: "Moderator",
        description: "Panelists, Dr. Avishek Poddar, Dr. Muthuvel, Dr. Neeraj Verma, Dr. Asha Shenoi"
      }
    ]
  },
  "dr.bhaktisarangi@gmail.com": {
    facultyName: "Bhakti Sarangi",
    email: "dr.bhaktisarangi@gmail.com",
    sessions: [
      {
        title: "Beyond Consent: Navigating Ethical Minefields in Pediatric Research",
        date: "9/11",
        role: "Panelist",
        description: "Dr. Madhu Otiv (Moderator), Panelists, Dr. Amita Kaul, Dr. Michael Canarie, Dr. Yasser Kazzaz"
      }
    ]
  },
  "bkmeher187@yahoo.co.in": {
    facultyName: "Bijay Kumar Meher",
    email: "bkmeher187@yahoo.co.in",
    sessions: [
      {
        title: "Pus, Air, and Trouble: Stepwise Care in Necrotising Pneumonia",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Pradeep Sharma, Dr. Rashmi Kapoor, Dr. Kaushik Maulik, Dr. Sebastian Gonzalez-Dambrauskas, Dr. Anjul Dayal"
      }
    ]
  },
  "chetanrmundada@yahoo.co.in": {
    facultyName: "Chetan Mundada",
    email: "chetanrmundada@yahoo.co.in",
    sessions: [
      {
        title: "Advanced Ventilation",
        date: "6/11",
        role: "Local Cordinator",
        description: "---"
      },
      {
        title: "Transfuse or Tolerate? Finding the Balance in Pediatric Critical Care",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Lakshmi Shobhavat, Dr. Anand Bhutada, Dr. Lalit Takia, Dr. Abhijeet Chaudhary"
      }
    ]
  },
  "lct120190@gmail.com": {
    facultyName: "Chidambaram",
    email: "lct120190@gmail.com",
    sessions: [
      {
        title: "GAME ON – \"Crash or Stabilise?\"",
        date: "7/11",
        role: "Quizmaster",
        description: "Fellow Quizmaster, Dr. Surjit Kumar Thappa"
      }
    ]
  },
  "dr.chiragsethi1@gmail.com": {
    facultyName: "Chirag Sethi",
    email: "dr.chiragsethi1@gmail.com",
    sessions: [
      {
        title: "Between Guidelines and Ground Reality: Talking to Families in Indian PICUs",
        date: "8/11",
        role: "Panelist",
        description: "Moderator, Dr Puneet Pooni, Panelists, Dr Bakul Parikh, Dr Hariharan Seetharaman, Dr Kwame Boateng"
      }
    ]
  },
  "daisykhera78@gmail.com": {
    facultyName: "Daisy Khera",
    email: "daisykhera78@gmail.com",
    sessions: [
      {
        title: "Dengue Gone Wild: Navigating the Complications",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Rachna Sharma, Dr. Sateesh Ghanta, Dr. Rujipat"
      }
    ]
  },
  "deepankarbansal@outlook.com": {
    facultyName: "Deepankar Bansal",
    email: "deepankarbansal@outlook.com",
    sessions: [
      {
        title: "Friend, Foe, or Firefighting Tool? CRRT & Plasmapheresis in Pediatric ALF",
        date: "9/11",
        role: "Panelist",
        description: "Jolly Chandaran (Moderator)"
      },
      {
        title: "PICU Liberation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "dhireengupta@gmail.com": {
    facultyName: "Dhiren Gupta",
    email: "dhireengupta@gmail.com",
    sessions: [
      {
        title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics.",
        date: "8/11",
        role: "Moderator",
        description: "Panelists, Dr. Mehak Bansal, Dr. Neil C, Dr. Swathi Rao, Dr. Namita Ravikumar"
      },
      {
        title: "POCUS (Advance)",
        date: "6/11",
        role: "National Coordinator",
        description: "---"
      }
    ]
  },
  "eborjacob@yahoo.com": {
    facultyName: "Ebor Jacob",
    email: "eborjacob@yahoo.com",
    sessions: [
      {
        title: "PICU Education & Training",
        date: "7/11",
        role: "Speaker",
        description: "Dr. Vinay Nadkarni, Dr. Michael Canarie, Dr. Traci Wolbrink, Dr. Atsushi Kawaguchi, Dr. Kirsten Gibbons, Dr. Karen Ka Yan LEUNG, Dr. Sainath Raman, Dr. Rujipat, Dr. John Adabie Appiah"
      },
      {
        title: "PediCritiCon Keynotes",
        date: "9/11",
        role: "Plenary",
        description: "---"
      },
      {
        title: "BPICC",
        date: "6/11",
        role: "National Coordinator",
        description: "---"
      }
    ]
  },
  // "farhanshaikh74@gmail.com": {
  //   facultyName: "Farhan Shaikh",
  //   email: "farhanshaikh74@gmail.com",
  //   sessions: [
  //     {
  //       title: "Monitoring of Strain and Stress without Using Oesophageal Manometry – Are We There Yet?",
  //       date: "7/11",
  //       role: "Speaker",
  //       description: "---"
  //     },
  //     {
  //       title: "PICU Brain Buzzer",
  //       date: "7/11",
  //       role: "QuizMaster",
  //       description: "---"
  //     }
  //   ]
  // },
  "basavgv@gmail.com": {
    facultyName: "GV Basavaraja",
    email: "basavgv@gmail.com",
    sessions: [
      {
        title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Rakshay Shetty (Moderator), Panelists, Dr. Banani Poddar, Dr. Hari Krishanan, Dr. Karthik Naryanan"
      },
      {
        title: "Tracheostomy in Pediatric Critical Care: Technique, Timing and Outcomes",
        date: "9/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "indirajayakumar@yahoo.com": {
    facultyName: "Indira Jayakumar",
    email: "indirajayakumar@yahoo.com",
    sessions: [
      {
        title: "HSCT: Navigating HSCT Challenges",
        date: "7/11",
        role: "Moderator",
        description: "Panelists, Dr. Raj Lakshmi Iyer, Dr. Reshma A, Dr. Abdul Rauf, Dr. Sanket R (CMC Vellore)"
      },
      {
        title: "ECMO",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "javedisi86@gmail.com": {
    facultyName: "Javed Ismail",
    email: "javedisi86@gmail.com",
    sessions: [
      {
        title: "Cardiac Failure & Cardiogenic Shock",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Priyavarthini (Moderator), Panelists, Dr. Ravi Kumar, Dr. Ikram Ul Haque, Dr. Sagar Hiremath"
      },
      {
        title: "Flush That Line! When and How to Use Heparin Locks",
        date: "9/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "PICU Liberation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "drjerincsekhar@gmail.com": {
    facultyName: "Jerin Sekhar",
    email: "drjerincsekhar@gmail.com",
    sessions: [
      {
        title: "Routine Neuroimaging in Pediatric Coma: CT vs. MRI as First-Line Modality?",
        date: "7/11",
        role: "Debate - FOR CT",
        description: "Co Debater, Dr. Madhusudan - For MRI"
      },
      {
        title: "PICU Liberation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "jhumaji@gmail.com": {
    facultyName: "Jhuma Sankar",
    email: "jhumaji@gmail.com",
    sessions: [
      {
        title: "Pediatric respiratory critical care research and promoting the development of a research network in India- identifying key gaps",
        date: "7/11",
        role: "Moderator",
        description: "Panelists, Dr Martin Kneyber, Dr Anil Sachdev, Dr. Lalita AV, Dr. Praveen Khilnani, Dr. Sunit Singhi"
      }
    ]
  },
  "drrajendrantk@gmail.com": {
    facultyName: "K Rajenderan",
    email: "drrajendrantk@gmail.com",
    sessions: [
      {
        title: "Surveillance Cultures: Guardians of Prevention or Generators of Noise?",
        date: "9/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "koushik.maulik@gmail.com": {
    facultyName: "Kaushik Maulik",
    email: "koushik.maulik@gmail.com",
    sessions: [
      {
        title: "Pus, Air, and Trouble: Stepwise Care in Necrotising Pneumonia",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Pradeep Sharma, Dr. Rashmi Kapoor, Dr. Sebastian Gonzalez-Dambrauskas, Dr. Anjul Dayal, Dr. Bijay Kumar Meher"
      },
      {
        title: "Cardiac Critical Care",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "narayanankarthik86@gmail.com": {
    facultyName: "Karthik Naryanan",
    email: "narayanankarthik86@gmail.com",
    sessions: [
      {
        title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Rakshay Shetty (Moderator), Panelists, Dr. GV Basavraja, Dr. Hari Krishanan, Dr. Banani Poddar"
      },
      {
        title: "POCUS (Advanced)",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "bpkaruns@gmail.com": {
    facultyName: "Karunakar BP",
    email: "bpkaruns@gmail.com",
    sessions: [
      {
        title: "Interpreting Critical Labs in Suspected Metabolic Diseases",
        date: "8/11",
        role: "Panelist",
        description: "Panelists, Dr. Parmanand, Dr. Satish Deopujari, Dr. Dayanand Nakate, Dr. Shalu Gupta"
      }
    ]
  },
  "drkaustabh@gmail.com": {
    facultyName: "Kaustabh Chaudhary",
    email: "drkaustabh@gmail.com",
    sessions: [
      {
        title: "Innovation Over Infrastructure: Delivering Neurorehab in Our Real World",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Kavita TK (Moderator), Panelists, Dr. Karen Ka Yan LEUNG, Dr. Naryanan P, Dr. Ririe"
      },
      {
        title: "Non-Invasive Respiratory Support",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "ammukvt@yahoo.co.in": {
    facultyName: "Kavita TK",
    email: "ammukvt@yahoo.co.in",
    sessions: [
      {
        title: "Innovation Over Infrastructure: Delivering Neurorehab in Our Real World.",
        date: "8/11",
        role: "Moderator",
        description: "Panelists:, Dr. Karen Ka Yan LEUNG, Dr. Naryanan P, Dr. Ririe, Dr. Kaustabh Chaudhary"
      }
    ]
  },
  "chugh.krishan@gmail.com": {
    facultyName: "Krishan Chugh",
    email: "chugh.krishan@gmail.com",
    sessions: [
      {
        title: "Muscles May Fail - Protocols Shouldn't !.. Extubation Strategies in Neuromuscular Disease.",
        date: "8/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "Breathless Battles: Viral Pneumonia That Won't Back Down: What's the Trend in Pediatric Viral Pneumonia?",
        date: "8/11",
        role: "Panellist",
        description: "Moderator, Dr Manish Sharma, Co-Panelists: Dr Bala Ramachandaran, Dr Hiroshi Kurosawa, Dr Ranganath Iyer"
      }
    ]
  },
  "mohangulla35@gmail.com": {
    facultyName: "Krishan Mohan Gulla",
    email: "mohangulla35@gmail.com",
    sessions: [
      {
        title: "CPR Meets Circuit: Is India Ready for the Leap?",
        date: "9/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "Cardiac Critical Care workshop",
        date: "6/11",
        role: "Worshop",
        description: "---"
      }
    ]
  },
  "kundanmittal@hotmail.com": {
    facultyName: "Kundan Mittal",
    email: "kundanmittal@hotmail.com",
    sessions: [
      {
        title: "Pediatric Polytrauma: To Cut or Not to Cut?",
        date: "9/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "lakshmishobhavat@gmail.com": {
    facultyName: "Lakshmi Shobhavat",
    email: "lakshmishobhavat@gmail.com",
    sessions: [
      {
        title: "Transfuse or Tolerate? Finding the Balance in Pediatric Critical Care",
        date: "9/11",
        role: "Speaker",
        description: "Panelists, Dr. Abhijeet Chaudhary, Dr. Anand Bhutada, Dr. Chetan Mundada, Dr. Lalit Takia"
      }
    ]
  },
  "lalitpgims@gmail.com": {
    facultyName: "Lalit Takia",
    email: "lalitpgims@gmail.com",
    sessions: [
      {
        title: "Transfuse or Tolerate? Finding the Balance in Pediatric Critical Care",
        date: "9/11",
        role: "Panelist",
        description: "Moderator, Dr Lakshmi Shobhavat, Co Panelist, Dr Anand Bhutada, Dr Chetan Mundada, Dr Abhijeet Chaudhary"
      },
      {
        title: "PICU Liberation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "drlalitha03@gmail.com": {
    facultyName: "Lalita AV",
    email: "drlalitha03@gmail.com",
    sessions: [
      {
        title: "Pediatric respiratory critical care research and promoting the development of a research network in India- identifying key gaps",
        date: "7/11",
        role: "Panelist",
        description: "Moderator, Dr Jhuma Sankar, Co Panelist, Dr Martin Kneyber, Dr Anil Sachdev, Dr Praveen Khilnani, Dr Sunit Singhi"
      },
      {
        title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
        date: "9/11",
        role: "Moderator",
        description: "Panelists, Dr. Suresh Kumar Panugati, Dr. Nitish Upadhaya, Dr. Atsushi Kawaguchi, Dr. Amit Vij"
      }
    ]
  },
  "lokeshdoc@gmail.com": {
    facultyName: "Lokesh Tiwari",
    email: "lokeshdoc@gmail.com",
    sessions: [
      {
        title: "Stamp of Quality or Just a Stamp? Impact of PICU Accreditation",
        date: "9/11",
        role: "Debater - Just a stamp",
        description: "Co-debator:, Dr. Shivkumar - Stamp of Quality"
      }
    ]
  },
  "madhu_otiv@hotmail.com": {
    facultyName: "Madhu Otiv",
    email: "madhu_otiv@hotmail.com",
    sessions: [
      {
        title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
        date: "8/11",
        role: "Panelist",
        description: "Moderator, Dr Mahesh Mohite, Co-panelist: Dr VSV Prasad, Dr John Adabie Appiah, Dr Mritunjay Pao"
      },
      {
        title: "Beyond Consent: Navigating Ethical Minefields in Pediatric Research",
        date: "9/11",
        role: "Moderator",
        description: "Panelists: Dr Amita Kaul, Dr Bhakti Sarangi, Dr Michael Canarie, Dr Yasser Kazzaz"
      }
    ]
  },
  "madhu_1511@yahoo.com": {
    facultyName: "Madhusudan",
    email: "madhu_1511@yahoo.com",
    sessions: [
      {
        title: "Routine Neuroimaging in Pediatric Coma: CT vs. MRI as First-Line Modality?",
        date: "7/11",
        role: "Debater - FOR MRI",
        description: "Co Debater, Dr. Jerin Sekhar - For CT"
      }
    ]
  },
  "mahesh.mohite180@gmail.com": {
    facultyName: "Mahesh Mohite",
    email: "mahesh.mohite180@gmail.com",
    sessions: [
      {
        title: "Fluid, Not Flood: Smarter Resuscitation in the PICU",
        date: "8/11",
        role: "Moderator",
        description: "Panelists: Dr Madhu Otiv, Dr VSV Prasad, Dr John Adabie Appiah, Dr Mritunjay Pao"
      },
      {
        title: "Bronchoscopy Workshop",
        date: "6/11",
        role: "National Coordinator",
        description: "---"
      }
    ]
  },
  "docmsdhaliwal@gmail.com": {
    facultyName: "Maninder Dhaliwal",
    email: "docmsdhaliwal@gmail.com",
    sessions: [
      {
        title: "Global Lungs, Local Challenges: Advancing Equitable Pediatric Respiratory Care.",
        date: "8/11",
        role: "Moderator",
        description: "Panelist, Dr. Rajiv Uttam, Dr. Sagar lad, Dr. Shekhar Venkatraman, Dr. Mounika Reddy"
      },
      {
        title: "Simulation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      },
      {
        title: "Quiz",
        date: "7/11",
        role: "Quiz master",
        description: "Co Quiz masters: Dr Karthik Narayanan, Dr Farhan Shaikh, Dr Milin Jambaghi"
      }
    ]
  },
  "sharmadrmanish@yahoo.co.in": {
    facultyName: "Manish Sharma",
    email: "sharmadrmanish@yahoo.co.in",
    sessions: [
      {
        title: "From Collapse to Comeback: Pediatric Cardiac Arrest through the Lens of Multidisciplinary Care",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Nameet Jerath (Moderator), Panelists, Dr. Soonu Udani, Dr. Vinay Nadkarni, Dr. Manu Sundaram"
      },
      {
        title: "Breathless Battles: Viral Pneumonia That Won't Back Down: What's the Trend in Pediatric Viral Pneumonia?",
        date: "8/11",
        role: "Moderator",
        description: "Panelists: Dr Bala Ramachandaran, Dr Krishan Chugh, Dr Hiroshi Kurosawa, Dr Ranganath Iyer"
      },
      {
        title: "Bronchoscopy",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "manjukedarnath@gmail.com": {
    facultyName: "Manju Kedarnath",
    email: "manjukedarnath@gmail.com",
    sessions: [
      {
        title: "Saving Lives, Saving Costs: Can We Do Both?",
        date: "9/11",
        role: "Panelist",
        description: "Moderator, Dr Nirmal Choraria, Co panelists, Dr Somnath Gorain, Dr Kshama Daphtary, Dr Akash Bang"
      }
    ]
  },
  "drmihir09@gmail.com": {
    facultyName: "Mihir Sarkar",
    email: "drmihir09@gmail.com",
    sessions: [
      {
        title: "Acute Flaccid Paralysis in the PICU: GBS, Myelitis, or Something Else?",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Rohit Vohra (Moderator), Panelists, Dr. Ramaling Loni, Dr. Mukesh Jain, Dr. Jesal Sheth"
      },
      {
        title: "Thrombosis Meets Cytokine Storm in Sepsis: What Should We Tame First?",
        date: "9/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "Simulation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "doc.mounikareddy@gmail.com": {
    facultyName: "Mounika Reddy",
    email: "doc.mounikareddy@gmail.com",
    sessions: [
      {
        title: "Global Lungs, Local Challenges: Advancing Equitable Pediatric Respiratory Care.",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Maninder Dhaliwal (Moderator), Panelist, Dr. Rajiv Uttam, Dr. Sagar lad, Dr. Shekhar Venkatraman"
      },
      {
        title: "CRRT and SLED",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "mukesh26.jain@gmail.com": {
    facultyName: "Mukesh Jain",
    email: "mukesh26.jain@gmail.com",
    sessions: [
      {
        title: "Acute Flaccid Paralysis in the PICU: GBS, Myelitis, or Something Else?",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Rohit Vohra (Moderator), Panelists, Dr. Ramaling Loni, Dr. Mihir Sarkar, Dr. Jesal Sheth"
      }
    ]
  },
  "mbaalaaji@yahoo.com": {
    facultyName: "Mullai Baalaji",
    email: "mbaalaaji@yahoo.com",
    sessions: [
      {
        title: "Autoimmune Encephalitis in Children: Critical Care Perspectives",
        date: "7/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "ECMO",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "rmv2210@gmail.com": {
    facultyName: "Muthuvel",
    email: "rmv2210@gmail.com",
    sessions: [
      {
        title: "Burnout in PICU: Caring for the Caring Team",
        date: "9/11",
        role: "Panelist",
        description: "Panelists, Dr. Avishek Poddar, Dr. Bala Ramachandaran, Dr. Neeraj Verma, Dr. Asha Shenoi"
      }
    ]
  },
  "dr_njerath@yahoo.com": {
    facultyName: "Nameet Jerath",
    email: "dr_njerath@yahoo.com",
    sessions: [
      {
        title: "From Collapse to Comeback: Pediatric Cardiac Arrest through the Lens of Multidisciplinary Care",
        date: "8/11",
        role: "Moderator",
        description: "Panelists, Dr. Soonu Udani, Dr. Vinay Nadkarni, Dr. Manu Sundaram, Dr. Manish Sharma"
      },
      {
        title: "Advanced Ventilation",
        date: "6/11",
        role: "National Coordinator",
        description: "---"
      }
    ]
  },
  "namitu.ravi@gmail.com": {
    facultyName: "Namita Ravikumar",
    email: "namitu.ravi@gmail.com",
    sessions: [
      {
        title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics.",
        date: "8/11",
        role: "Panelist",
        description: "Moderator, Dr Dhiren Gupta, Panelist: Dr Mehak Bansal, Dr Neil C, Dr Swathi Rao"
      },
      {
        title: "BIPAP Quick Hits: Setting Up for Success",
        date: "9/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "Acute Critical Care for Practicing Paediatricians",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "vnkkumar@yahoo.com": {
    facultyName: "Nanda Kishore",
    email: "vnkkumar@yahoo.com",
    sessions: [
      {
        title: "Keeping the Calm: Practical Challenges in Sedating the ECMO Child",
        date: "9/11",
        role: "Panelist",
        description: "Dr. Parag Dakate (Moderator), Panelists, Dr. Ravi Sharma, Dr. Prabhas Prasun Giri, Dr. Chegondi, Dr. Madhuradhar"
      },
      {
        title: "ECMO",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "drneil.cs@gmail.com": {
    facultyName: "Neil C",
    email: "drneil.cs@gmail.com",
    sessions: [
      {
        title: "Echo in Action: Real-Time Clarity for Real-Life Hemodynamics.",
        date: "8/11",
        role: "Panelist",
        description: "Moderator: Dr Dhiren Gupta, Co-Panelists, Dr. Mehak Bansal, Dr. Swathi Rao, Dr. Namita Ravikumar"
      }
    ]
  },
  "nirmal_choraria@yahoo.com": {
    facultyName: "Nirmal Choraria",
    email: "nirmal_choraria@yahoo.com",
    sessions: [
      {
        title: "Saving Lives, Saving Costs: Can We Do Both?",
        date: "9/11",
        role: "Moderator",
        description: "Panellists: Dr Somnath Gorain, Dr Manju Kedarnath, Dr Kshama Daphtary, Dr Akash Bang"
      },
      {
        title: "Buying Smart: Equipping Your PICU for Function, Not Fashion",
        date: "9/11",
        role: "Panelist",
        description: "Moderator, Dr VSV Prasad, Panellists: Dr G. Ramesh, Dr Rafiq Ahmed, Dr Anand Buthada, Dr Preetam"
      }
    ]
  },
  "niteshupadhyay22@gmail.com": {
    facultyName: "Nitish Upadhaya",
    email: "niteshupadhyay22@gmail.com",
    sessions: [
      {
        title: "Electrolyte Emergencies in the PICU: Algorithms, Controversies, and Pitfalls",
        date: "9/11",
        role: "Panelist",
        description: "Dr. Lalitha AV (Moderator), Panelists, Dr. Suresh Kumar Panugati, Dr. Amit Vij, Dr. Atsushi Kawaguchi"
      }
    ]
  },
  "paggy4u@gmail.com": {
    facultyName: "Parag Dakate",
    email: "paggy4u@gmail.com",
    sessions: [
      {
        title: "Management of Complications related to blood based dialysis in PICU",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Sateesh (Moderator), Panelists, Dr. Raghad Abdwani, Dr. Sumant Patil, Dr. Saumen Meur, Dr. Rohit Bhowmick"
      },
      {
        title: "Keeping the Calm: Practical Challenges in Sedating the ECMO Child",
        date: "9/11",
        role: "Moderator",
        description: "Panellists: Dr Prashanth Mitharwal, Dr Prabhas Prasun Giri, Dr Madhudhar Chegondi, Dr Nanda Kishore"
      }
    ]
  },
  "pandankar@gmail.com": {
    facultyName: "Parmanand",
    email: "pandankar@gmail.com",
    sessions: [
      {
        title: "Interpreting Critical Labs in Suspected Metabolic Disease",
        date: "8/11",
        role: "Moderator",
        description: "Panellists: Dr Satish Deopujari, Dr Karunakar BP, Dr Dayanand Nakate, Dr Shalu Gupta"
      }
    ]
  },
  "drprabhasgiri@gmail.com": {
    facultyName: "Prabhas Prasun Giri",
    email: "drprabhasgiri@gmail.com",
    sessions: [
      {
        title: "Keeping the Calm: Practical Challenges in Sedating the ECMO Child",
        date: "9/11",
        role: "Panelist",
        description: "Moderator, Dr Parag Dakate, Co Panellists: Dr Prashanth Mitharwal, Dr Madhudhar Chegondi, Dr Nanda Kishore"
      }
    ]
  },
  "drsharma025@gmail.com": {
    facultyName: "Pradeep Sharma",
    email: "drsharma025@gmail.com",
    sessions: [
      {
        title: "Pus, Air, and Trouble: Stepwise Care in Necrotising Pneumonia",
        date: "8/11",
        role: "Moderator",
        description: "Panellists: Dr Rashmi Kapoor, Dr Kaushik Maulik, Dr Sebastian Gonzalez-Dambrauskas, Dr Anjul Dayal"
      }
    ]
  },
  "praveenkhilnani1957@gmail.com": {
    facultyName: "Praveen Khilnani",
    email: "praveenkhilnani1957@gmail.com",
    sessions: [
      {
        title: "Pediatric respiratory critical care research and promoting the development of a research network in India- identifying key gaps",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Jhuma Sankar (Moderator), Panelists, Dr Martin Kneyber, Dr. Lalita AV, Dr. Anil Sachdeva, Dr. Sunit Singhi"
      },
      {
        title: "When Wheeze Won't Ease: Tackling Severe Pediatric Asthma",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "drpreethamp@gmail.com": {
    facultyName: "Preetam",
    email: "drpreethamp@gmail.com",
    sessions: [
      {
        title: "Buying Smart: Equipping Your PICU for Function, Not Fashion",
        date: "9/11",
        role: "Panelist",
        description: "Moderator, Dr VSV Prasad, Co-Panellists: Dr G. Ramesh, Dr Rafiq Ahmed, Dr Anand Buthada, Dr Nirmal Choraria"
      }
    ]
  },
  "preetha07doc@gmail.com": {
    facultyName: "Preetha Joshi",
    email: "preetha07doc@gmail.com",
    sessions: [
      {
        title: "Palliative Cardiac Surgery in Resource-Limited Settings: Ethical Necessity or Compromise?",
        date: "8/11",
        role: "Debater - FOR Ethical Necessity",
        description: "Co Debater, Dr. Amish Vora for compromise"
      },
      {
        title: "Cardiac Critical Care",
        date: "6/11",
        role: "Workshop",
        description: "---"
      }
    ]
  },
  "priteshnagar@gmail.com": {
    facultyName: "Pritesh Nagar",
    email: "priteshnagar@gmail.com",
    sessions: [
      {
        title: "Simulation-Based Training: Essential for Quality or Overrated Add-On?",
        date: "9/11",
        role: "Debater - For Overrated add on",
        description: "Co Debater, Dr. Hiroshi Kurosawa- For Essential for Quality"
      },
      {
        title: "Simulation",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "priyavarthiniv@gmail.com": {
    facultyName: "Priyavarthini",
    email: "priyavarthiniv@gmail.com",
    sessions: [
      {
        title: "Cardiac Failure & Cardiogenic Shock",
        date: "7/11",
        role: "Moderator",
        description: "Panellists: Dr. Ravi Kumar, Dr Ikram Ul Haque, Dr Javed Ismail, Dr.Sagar Hiremath"
      },
      {
        title: "Cardiac Critical Care",
        date: "6/11",
        role: "Workshop",
        description: "---"
      }
    ]
  },
  "prapgi697@gmail.com": {
    facultyName: "Pushpraj Awasthi",
    email: "prapgi697@gmail.com",
    sessions: [
      {
        title: "Super-Refractory Status Epilepticus: How Far Should We Go?",
        date: "7/11",
        role: "Panelist",
        description: "Moderator, Dr Atul Jindle, Co-Pannelists: Dr Matthew Kirschen, Dr Siva Vyasam, Dr Deepika Gandhi"
      }
    ]
  },
  "rachna9us@gmail.com": {
    facultyName: "Rachana Sharma",
    email: "rachna9us@gmail.com",
    sessions: [
      {
        title: "Innovators of Tomorrow: Pediatric Critical Care DM/DrNB Thesis Awards",
        date: "7/11",
        role: "Co-Charperson with Dr Jolly",
        description: "Judges, Dr. Hari Krishnan, Dr. Sainath Raman, Dr. Hiroshi Kurosawa"
      },
      {
        title: "Dengue Gone Wild: Navigating the Complications",
        date: "8/11",
        role: "Moderator",
        description: "Panellists: Dr Sateesh Ghanta, Dr Daisy Khera, Dr Rujipat, Dr Sameer Sadawarte"
      }
    ]
  },
  "drriyer04@gmail.com": {
    facultyName: "Raj Lakshmi Iyer",
    email: "drriyer04@gmail.com",
    sessions: [
      {
        title: "HSCT: Navigating HSCT Challenges",
        date: "7/11",
        role: "Panelist",
        description: "Moderator, Dr Indira Jayakumar, Co-Panellists: Dr Reshma A, Dr Abdul Rauf, Dr Sanket R"
      },
      {
        title: "Critical Care of Cellular Therapies in Transplant & Oncology (CAR-T, Immunotherapies)",
        date: "7/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "rajeswarins@yahoo.co.in": {
    facultyName: "Rajeshwari",
    email: "rajeswarins@yahoo.co.in",
    sessions: [
      {
        title: "Crack the Cardiac Code: Applied Physiology Made Simple",
        date: "7/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "rajivuttam@hotmail.com": {
    facultyName: "Rajiv Uttam",
    email: "rajivuttam@hotmail.com",
    sessions: [
      {
        title: "Global Lungs, Local Challenges: Advancing Equitable Pediatric Respiratory Care.",
        date: "8/11",
        role: "Panelist",
        description: "Moderator, Dr Maninder Dhaliwal, Co-Panellists: Dr Sagar lad, Dr Shekhar Venkatraman, Dr Mounika Reddy"
      },
      {
        title: "Head Start: Timely Interventions in Traumatic Brain Injury",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "rakshayshetty@gmail.com": {
    facultyName: "Rakshay Shetty",
    email: "rakshayshetty@gmail.com",
    sessions: [
      {
        title: "Pediatric Research Networking",
        date: "7/11",
        role: "Speaker",
        description: "Dr. Vinay Nadkarni, Dr. Nilesh Mehta, Dr. Sebastian Gonzalez-Dambrauskas, Dr. Hiroshi Kurosawa, Dr. Traci Wolbrink, Dr. Atsushi Kawaguchi, Dr. Kirsten Gibbons, Dr. Yasser Kazzaz, Dr. Lee Jan Hau, Dr. Karen Ka Yan LEUNG, Dr. Sainath Raman, Dr. Rujipat, Dr. John Adabie Appiah, Dr. Kandamaran, Dr. Ririe, Dr. Manu Sundaram"
      },
      {
        title: "Data Dreams or Data Drama? Unmasking the National PICU Database",
        date: "8/11",
        role: "Moderator",
        description: "Panelists, Dr. Banani Poddar, Dr. GV Basavraja, Dr. Hari Krishanan, Dr. Karthik Naryanan"
      },
      {
        title: "Simulation",
        date: "6/11",
        role: "National Coordinator",
        description: "---"
      }
    ]
  },
  "ranganathaniyer@yahoo.com": {
    facultyName: "Ranganath Iyer",
    email: "ranganathaniyer@yahoo.com",
    sessions: [
      {
        title: "Breathless Battles: Viral Pneumonia That Won't Back Down: What's the Trend in Pediatric Viral Pneumonia?",
        date: "8/11",
        role: "Panelist",
        description: "Dr. Manish Sharma (Moderator), Panelists, Dr. Bala Ramachandaran, Dr. Hiroshi Kurosawa, Dr. Anil Sachdeva"
      }
    ]
  },
  "ravikomalla@gmail.com": {
    facultyName: "Ravi Babu K",
    email: "ravikomalla@gmail.com",
    sessions: [
      {
        title: "Liver Transplant: Mastering Post-Op Complications",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Ravi T (Moderator), Panelists, Dr. Akashdeep, Dr. Prashant Bachina, Dr. Sonal Gajbhiya"
      }
    ]
  },
  "drravisharma8@gmail.com": {
    facultyName: "Ravi Sharma",
    email: "drravisharma8@gmail.com",
    sessions: [
      {
        title: "Hemadsorption in the PICU: Magic Filter or Misplaced Faith?",
        date: "9/11",
        role: "Debate : For Hemadsorption is Magic Filter",
        description: "Co- Debator: Dr Romit Saxena - For Hemadsorption is Misplaced Faith"
      },
      {
        title: "ECMO",
        date: "6/11",
        role: "National coordinator",
        description: "---"
      }
    ]
  },
  "rekhasolomon1@gmail.com": {
    facultyName: "Rekha Solomon",
    email: "rekhasolomon1@gmail.com",
    sessions: [
      {
        title: "Lactate in Septic Shock: Marker of Perfusion or Marker of Confusion?",
        date: "8/11",
        role: "Debater - FOR Marker of perfusion",
        description: "Co Debater, Dr. Sandeep Dhingra - For marker of confusion"
      }
    ]
  },
  "reshma1987@gmail.com": {
    facultyName: "Reshma A",
    email: "reshma1987@gmail.com",
    sessions: [
      {
        title: "HSCT: Navigating HSCT Challenges",
        date: "7/11",
        role: "Panelist",
        description: "Dr. Indira Jayakumar (Moderator), Panelists, Dr. Abdul Rauf, Dr. Raj Lakshmi Iyer, Dr. Sanket R"
      }
    ]
  },
  "drrohitvohra87@gmail.com": {
    facultyName: "Rohit Vohra",
    email: "drrohitvohra87@gmail.com",
    sessions: [
      {
        title: "Acute Flaccid Paralysis in the PICU: GBS, Myelitis, or Something Else?",
        date: "7/11",
        role: "Moderator",
        description: "Panellists: Dr Jesal Sheth, Dr Ramaling Loni, Dr Mukesh Jain, Dr Mihir Sarkar"
      }
    ]
  },
  "drromit@yahoo.co.in": {
    facultyName: "Romit Saxena",
    email: "drromit@yahoo.co.in",
    sessions: [
      {
        title: "Transport",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      },
      {
        title: "Hemadsorption in the PICU: Magic Filter or Misplaced Faith?",
        date: "9/11",
        role: "Dr Romit Saxena Debator: for Hemadsorption is Misplaced Faith",
        description: "Co- Debator, Dr Ravi Sharma - For haemadsorption is Magic filter"
      }
    ]
  },
  "docsagar2002@yahoo.co.in": {
    facultyName: "Sagar Hiremath",
    email: "docsagar2002@yahoo.co.in",
    sessions: [
      {
        title: "Cardiac Failure & Cardiogenic Shock",
        date: "7/11",
        role: "Panelists",
        description: "Dr. Priyavarthini (Moderator), Panelists, Dr. Ravi Kumar, Dr Ikram Ul Haque, Dr Javed Ismail"
      }
    ]
  },
  "drsagarlad@yahoo.com": {
    facultyName: "Sagar lad",
    email: "drsagarlad@yahoo.com",
    sessions: [
      {
        title: "Global Lungs, Local Challenges: Advancing Equitable Pediatric Respiratory Care.",
        date: "8/11",
        role: "Panelists",
        description: "Dr Maninder Dhaliwal (Moderator), Panelists, Dr Rajiv Uttam, Dr Shekhar Venkatraman, Dr Mounika Reddy"
      }
    ]
  },
  "ksajith120@yahoo.com": {
    facultyName: "Sajith Keswan",
    email: "ksajith120@yahoo.com",
    sessions: [
      {
        title: "Concept of Recruitment to Inflation Ratio - What does it really mean ?",
        date: "7/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "ssadawarte@gmail.com": {
    facultyName: "Sameer Sadawarte",
    email: "ssadawarte@gmail.com",
    sessions: [
      {
        title: "Dengue Gone Wild: Navigating the Complications (Agenda: Complicated Dengue)",
        date: "8/11",
        role: "Panelists",
        description: "Dr Rachna Sharma(Moderator), Panelists, Dr Sateesh Ghanta, Dr Daisy Khera, Dr Rujipat"
      }
    ]
  },
  "dhingrasandeep@yahoo.co.in": {
    facultyName: "Sandeep Dhingra",
    email: "dhingrasandeep@yahoo.co.in",
    sessions: [
      {
        title: "Lactate in Septic Shock: Marker of Perfusion or Marker of Confusion?",
        date: "8/11",
        role: "Debater - FOR Marker of CONFUSION",
        description: "Co- Debate, Dr Rekha Solomon - FOR Marker of perfusion"
      }
    ]
  },
  "drghorpadesanjay@gmail.com": {
    facultyName: "Sanjay Ghorpade",
    email: "drghorpadesanjay@gmail.com",
    sessions: [
      {
        title: "Biomarkers in Pediatric Critical Care: Hype vs. Help",
        date: "9/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "drsoans62@gmail.com": {
    facultyName: "Santosh Soans",
    email: "drsoans62@gmail.com",
    sessions: [
      {
        title: "Code Red: Rapid Response to Pediatric GI Bleed",
        date: "8/11",
        role: "Speaker",
        description: "---"
      }
    ]
  },
  "sasidarpgi@gmail.com": {
    facultyName: "Sasidaran",
    email: "sasidarpgi@gmail.com",
    sessions: [
      {
        title: "Precision prescription methods in CRRT",
        date: "7/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "PICU Case Cafe",
        date: "7/11",
        role: "Chairperson",
        description: "---"
      }
    ]
  },
  "drsatishghanta@gmail.com": {
    facultyName: "Sateesh Ghanta",
    email: "drsatishghanta@gmail.com",
    sessions: [
      {
        title: "Dengue Gone Wild: Navigating the Complications",
        date: "8/11",
        role: "Panelist",
        description: "Dr Rachna Sharma(Moderator), Panelists, Dr Daisy Khera, Dr Rujipat, Dr Sameer Sadawarte"
      },
      {
        title: "Non-Invasive Respiratory Support",
        date: "6/11",
        role: "Workshop Faculty",
        description: "---"
      }
    ]
  },
  "deopujaris@gmail.com": {
    facultyName: "Satish Deopujari",
    email: "deopujaris@gmail.com",
    sessions: [
      {
        title: "From Screen to Stethoscope: Apps That Enhance Pediatric Care",
        date: "7/11",
        role: "Speaker",
        description: "---"
      },
      {
        title: "Interpreting Critical Labs in Suspected Metabolic Disease",
        date: "8/11",
        role: "Panelist",
        description: "Dr Parmanand (Moderator), Panelists, Dr Karunakar BP, Dr Dayanand Nakate, Dr Shalu Gupta"
      }
    ]
  }
};

// Generate HTML for a specific faculty member
function renderFacultyHTML(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];
  
  if (!facultyData) {
    console.error(`No data found for faculty: ${facultyEmail}`);
    return "";
  }

  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}`;

  const rows = facultyData.sessions
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #eaeaea;">
        <td style="padding:12px; border-right:1px solid #ddd;">${s.title}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.date}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${s.role}</td>
        <td style="padding:12px;">${s.description}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Session Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <!-- Header -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
      <!-- PediCritiCon Header Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
           alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>

  <div style="background:#fff; padding:30px; border:1px solid #ddd;">
    <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">PediCritiCon 2025 , Hyderabad</h1>
    
    <p>Dear Dr. <strong>${facultyData.facultyName}</strong>,</p>
    <p>Greetings from the Scientific Committee, PediCritiCon 2025!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.</p>
    <p>Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:</p>
    
    <!-- 4-column table with description -->
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <thead style="background:#efefef;">
        <tr>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Date</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Role</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Conference Registration & Participation -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
      <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Acceptance & Details:</h4>
      <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
          <strong>Please confirm your acceptance by clicking Accept or Decline on the faculty dashboard</strong>
      </p>
    </div>

    <!-- Access Faculty Dashboard Button -->
    <p style="text-align:center; margin: 30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#764ba2;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(118,75,162,0.4);
        ">
        🔐 Access Faculty Dashboard
      </a>
    </p>

    <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 14px;">🔹 Hospitality & Travel:</h4>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Accommodation:</strong> We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Travel:</strong> You are requested to kindly arrange your own travel.
        </p>
        <p style="color: #1b5e20; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
            <strong>Registration:</strong> You will receive a unique link at early bird rates upon acceptance of the invite.
        </p>
    </div>

    <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 15px; margin: 25px 0;">
        <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> on the faculty dashboard at 
            the earliest so we may make suitable adjustments.
        </p>
        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>
    </div>

    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #764ba2; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #764ba2;">Scientific Committee, PediCritiCon 2025</span>
        </p>
    </div>
    
    <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
      If you have questions, contact your event coordinator. This message was sent automatically.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
      <!-- PediCritiCon Footer Image -->
      <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
           alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
           style="width: 100%; height: auto; display: block; max-width: 600px;" />
  </div>
</body>
</html>
`;
}

// Generate plain text email for a specific faculty member
function generateFacultyTextEmail(facultyEmail: string) {
  const facultyData = FACULTY_DATA[facultyEmail as keyof typeof FACULTY_DATA];
  
  if (!facultyData) {
    return "";
  }

  const sessionsText = facultyData.sessions
    .map((s, index) => `Date ${s.date}:
Session: ${s.title}
Role: ${s.role}
Description: ${s.description}`)
    .join("\n\n");

  return `Subject: PediCritiCon 2025 - Faculty Invitation

Dear Dr. ${facultyData.facultyName},

Greetings from the Scientific Committee, PediCritiCon 2025!

It gives us immense pleasure to invite you as a distinguished faculty member to PediCritiCon 2025 – the 27th National Conference of the IAP Intensive Care Chapter, hosted by the Pediatric Intensive Care Chapter—Kakatiya, Telangana State.

📅 Dates: November 6–9, 2025
📍 Venue: Hyderabad International Convention Centre (HICC), Hyderabad, India

Your proposed faculty role${facultyData.sessions.length > 1 ? "s are" : " is"} outlined below:

Your Faculty Invitation – PediCritiCon 2025

${sessionsText}

👉 Kindly confirm your acceptance by clicking Yes or No 
Login here: ${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(facultyData.email)}

🔹 Hospitality & Travel:
Accommodation: We will provide you with twin-sharing accommodation for the duration of the conference. Email will follow with more details on this.
Travel: You are requested to kindly arrange your own travel.
Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025
`;
}

/**
 * Send personalized emails to all faculty members in FACULTY_DATA
 */
export async function sendBulkInviteEmail(
  sessions?: any[],  // Ignored
  facultyName?: string,  // Ignored  
  email?: string  // Ignored
) {
  const results = [];
  
  // Send personalized email to each faculty member
  for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
    try {
      const html = renderFacultyHTML(facultyEmail);
      const text = generateFacultyTextEmail(facultyEmail);
      
      const result = await sendMail({
        to: facultyData.email,
        subject: `PediCritiCon 2025 - Faculty Invitation`,
        text,
        html,
      });
      
      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: result.ok,
        message: result.message || "Email sent successfully"
      });
      
      console.log(`Email sent to ${facultyData.facultyName} (${facultyData.email}): ${result.ok ? 'Success' : 'Failed'}`);
      
    } catch (error) {
      console.error(`Failed to send email to ${facultyData.facultyName}:`, error);
      results.push({
        email: facultyData.email,
        name: facultyData.facultyName,
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  
  // Return summary of all sends
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`Email Summary: ${successCount} successful, ${failureCount} failed out of ${results.length} total`);
  
  return {
    ok: failureCount === 0,
    message: `Sent ${successCount}/${results.length} emails successfully`,
    results: results
  };
}

/**
 * Send personalized emails to all faculty members in FACULTY_DATA
 * Input parameters are ignored
 */
export async function sendInviteEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  email?: string  // Ignored
) {
  return sendBulkInviteEmail(); // Calls the bulk function that sends to all faculty
}

/**
 * Send update emails to all faculty members in FACULTY_DATA
 * Input parameters are ignored
 */
export async function sendUpdateEmail(
  session?: any,  // Ignored
  facultyName?: string,  // Ignored
  roomName?: string  // Ignored
): Promise<{ ok: boolean; message?: string }> {
  try {
    const results = [];
    
    // Send update email to each faculty member
    for (const [facultyEmail, facultyData] of Object.entries(FACULTY_DATA)) {
      try {
        const sessionsText = facultyData.sessions
          .map(s => `Session: "${s.title}" - ${s.date} - ${s.role}
Description: ${s.description}`)
          .join('\n\n');

        const text = `Hello ${facultyData.facultyName},

Your session${facultyData.sessions.length > 1 ? 's have' : ' has'} been updated:

${sessionsText}

Please confirm your availability again as the schedule has changed.

Registration: You will receive a unique link at early bird rates upon acceptance of the invite.

Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. If you are unable to accept or face a scheduling conflict, please indicate No at the earliest so we may make suitable adjustments.

We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 a memorable success.

Warm regards,
Scientific Committee, PediCritiCon 2025

Login here: ${baseUrl.replace(
          /\/+$/,
          ""
        )}/faculty-login?email=${encodeURIComponent(facultyData.email)}
`;

        const result = await sendMail({
          to: facultyData.email,
          subject: `📅 Session Updated: PediCritiCon 2025`,
          text,
          html: renderFacultyHTML(facultyEmail), // Use their personalized HTML
        });
        
        results.push({
          email: facultyData.email,
          success: result.ok
        });
        
      } catch (error) {
        console.error(`Failed to send update email to ${facultyData.facultyName}:`, error);
        results.push({
          email: facultyData.email,
          success: false
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return {
      ok: failureCount === 0,
      message: `Update emails: ${successCount}/${results.length} sent successfully`
    };
    
  } catch (error) {
    console.error("Failed to send update emails:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}