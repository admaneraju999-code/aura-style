import { ok, serverError, sendOptions } from "../lib/response.js";
import { initDb, sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method === "GET") return list(req, res);
  return sendOptions(res);
}

async function list(req, res) {
  try {
    await initDb();
    await seedInspirations();
    const { rows } = await sql.query(`SELECT * FROM inspirations ORDER BY favorite DESC, id ASC`);
    return ok(res, rows);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function seedInspirations() {
  const count = await sql.query(`SELECT count(*) AS n FROM inspirations`);
  if (Number(count.rows[0].n) > 0) return;

  const seeds = [
    {
      title: "Tailored Trench & Trousers",
      tag: "casual",
      image_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB-RqCVWSyPGJd-JpbSqtb4V9jPK0zFxQn4OTMb9l3rC02Dac7oXXNmrKEebTIRXIivGnlp3kNJetXYDag1InNQwN9jOxB2WMvSXynp49ErjuqcLPfIit-fbvalLQbfC8hY4WYmfPjd5XpT-8RTGp-Mtl0E9CxZp8_v2aRMT7nwk8irVg0xaWg5BYn-Sp8jAi6oVhsiO56T4ncqiRMU_cBT-oXL9dYkgOPqXp_YnVR0K4HSlZcvnXRB",
    },
    {
      title: "Minimal Streetwear",
      tag: "streetwear",
      image_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA-F4BvI0newFBrawL3NsaRBcRoLUOl7pjzqOjMSOeAVPkLzjMI8i8nSnrAI4zHsUfmJ2oJH2Ssa3rmF6bGGHu4AV7y2GV0dL-q6cdd8ZjdqfdXUZhJIXWzQdZ4uIIaJ0uVB5euDHGrD-gmpG5hLlbqtXL0c-Z5PZLiF0P0yPmEN9FJnhzsgp2OZI-94NPhhDPBDSCEaE8WBMFQD3TLBOvLIXfIPTuGSFZ752I1mQS5lnLzVEB9LCGrB",
    },
    {
      title: "Silk & Structured Accessories",
      tag: "evening",
      image_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD9FRLJC8ySOlr7BODqWOc6Pjj3ZPB1VzpIanU65H3_z1g6LhNEMZwM8rM-BWBr9LHU7WlvPyqMjxBbP_qAw7bpVmwTT1IpvJGaxECaLnGibKXW-adQNgVdlORclKi7E7ifdqzI8GMkCIuXl10YvbvUm4xVo_XqumHIZkMfB4VQdVN8XPUtisrdr1y_9jcJyr5ZW5f2BRzuSSS1o0KhMA-h8o8oyxmdc47-IvvM8dRUItA2mlOBTUTkp",
    },
    {
      title: "Classic Office Look",
      tag: "office",
      image_url:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBOWyonxIic6BxTmZb4N9eD4mf9qC16dD96gdiMTaMErMLo913EVKpCsnL697rr0HaD7N-lJrYn_UE16EC5_n4XEc_tdeiIcYzX63I3xS1uFU46g4FcC-dfttdtW7ZDolfykEc4BK8vH8ikpkRfEoddBK8j3Qgfbx-2RJz1cMMi-e39CwamTymFHBzZRXBvUhucBM-0J3scffZVxpfYQmMWJo3-csiIwhuY42mYo7m9gocAmjC6344K",
    },
  ];

  for (const s of seeds) {
    await sql.query(
      `INSERT INTO inspirations (title, tag, image_url) VALUES ($1, $2, $3)`,
      [s.title, s.tag, s.image_url]
    );
  }
}
