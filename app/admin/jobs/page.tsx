"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ------------------ Types ------------------ */

type Stage = "registered" | "interview" | "placed" | "rejected";
type Domain = "IT" | "Non-IT";

type JobSeeker = {
  id: string;
  name: string;
  email: string;
  domain: Domain;
  company?: string;
  stage: Stage;
};

/* ------------------ Constants ------------------ */

const STAGES: Stage[] = [
  "registered",
  "interview",
  "placed",
  "rejected",
];

const stageColors: Record<Stage, string> = {
  registered: "bg-gray-600/20 text-gray-300",
  interview: "bg-yellow-600/20 text-yellow-400",
  placed: "bg-green-600/20 text-green-400",
  rejected: "bg-red-600/20 text-red-400",
};

const getNextStage = (current: Stage): Stage => {
  const index = STAGES.indexOf(current);
  if (index === -1 || index === STAGES.length - 1) {
    return "registered";
  }
  return STAGES[index + 1];
};

/* ------------------ Component ------------------ */

export default function JobsPage() {
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyInput, setCompanyInput] = useState("");

  useEffect(() => {
    loadJobSeekers();
  }, []);

  const loadJobSeekers = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "job_seekers"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<JobSeeker, "id">),
    }));
    setJobSeekers(data);
    setLoading(false);
  };

  /* -------- Admin Actions -------- */

  const updateStage = async (id: string, stage: Stage) => {
    await updateDoc(doc(db, "job_seekers", id), {
      stage: getNextStage(stage),
    });
    loadJobSeekers();
  };

  const toggleDomain = async (id: string, domain: Domain) => {
    await updateDoc(doc(db, "job_seekers", id), {
      domain: domain === "IT" ? "Non-IT" : "IT",
    });
    loadJobSeekers();
  };

  const deleteJobSeeker = async (id: string) => {
    const ok = confirm("Are you sure you want to delete this job seeker?");
    if (!ok) return;

    await deleteDoc(doc(db, "job_seekers", id));
    loadJobSeekers();
  };

  const saveCompany = async (id: string) => {
    if (!companyInput.trim()) return;

    await updateDoc(doc(db, "job_seekers", id), {
      company: companyInput.trim(),
    });

    setEditingId(null);
    setCompanyInput("");
    loadJobSeekers();
  };

  /* ------------------ UI ------------------ */

  if (loading) {
    return <p className="text-gray-400">Loading job seekers...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Jobs & Placements</h1>
      <p className="text-gray-400 mb-6">
        Admin placement management panel
      </p>

      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-zinc-900 text-gray-300">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Domain</th>
              <th className="p-3">Company</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobSeekers.map((j) => (
              <tr
                key={j.id}
                className="border-t border-zinc-800 hover:bg-zinc-900/40"
              >
                <td className="p-3">{j.name}</td>
                <td className="p-3">{j.email}</td>

                {/* Domain */}
                <td className="p-3">
                  <button
                    onClick={() => toggleDomain(j.id, j.domain)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      j.domain === "IT"
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-orange-600/20 text-orange-400"
                    }`}
                  >
                    {j.domain}
                  </button>
                </td>

                {/* Company Inline Edit */}
                <td className="p-3">
                  {editingId === j.id ? (
                    <div className="flex gap-2">
                      <input
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        className="px-2 py-1 text-sm bg-black border border-zinc-700 rounded"
                        placeholder="Company name"
                      />
                      <button
                        onClick={() => saveCompany(j.id)}
                        className="px-2 py-1 text-xs bg-green-600 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-xs bg-gray-600 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {j.company || "Not Assigned"}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(j.id);
                          setCompanyInput(j.company || "");
                        }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>

                {/* Stage */}
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm capitalize ${
                      stageColors[j.stage]
                    }`}
                  >
                    {j.stage}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => updateStage(j.id, j.stage)}
                    className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700"
                  >
                    Next Stage
                  </button>

                  <button
                    onClick={() => deleteJobSeeker(j.id)}
                    className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
