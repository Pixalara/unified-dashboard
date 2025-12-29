"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ================= Types ================= */

type Course = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  courseId?: string;
  status?: "Enrolled" | "Active" | "Completed";
};

type JobSeeker = {
  id: string;
  stage?: "Registered" | "Interview" | "Placed" | "Rejected";
};

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= Fetch ================= */

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "courses")).then((snap) =>
        setCourses(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
        )
      ),
      getDocs(collection(db, "growth_students")).then((snap) =>
        setStudents(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Student, "id">),
          }))
        )
      ),
      getDocs(collection(db, "job_seekers")).then((snap) =>
        setJobSeekers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JobSeeker, "id">),
          }))
        )
      ),
    ]).finally(() => setLoading(false));
  }, []);

  /* ================= Course → Student count ================= */

  const studentCountByCourse = students.reduce<Record<string, number>>(
    (acc, s) => {
      if (s.courseId) acc[s.courseId] = (acc[s.courseId] || 0) + 1;
      return acc;
    },
    {}
  );

  /* ================= Growth Students stats ================= */

  const studentStats = students.reduce(
    (acc, s) => {
      acc.total++;
      if (s.status === "Enrolled") acc.enrolled++;
      if (s.status === "Active") acc.active++;
      if (s.status === "Completed") acc.completed++;
      return acc;
    },
    {
      total: 0,
      enrolled: 0,
      active: 0,
      completed: 0,
    }
  );

  /* ================= Job Seekers stats ================= */

  const jobStats = jobSeekers.reduce(
    (acc, js) => {
      acc.total++;
      if (js.stage === "Interview") acc.interview++;
      if (js.stage === "Placed") acc.placed++;
      if (js.stage === "Rejected") acc.rejected++;
      return acc;
    },
    {
      total: 0,
      interview: 0,
      placed: 0,
      rejected: 0,
    }
  );

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Real-time overview from Firestore
      </p>

      {/* ================= Courses ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {courses.map((course) => (
          <Card
            key={course.id}
            title={course.name}
            value={studentCountByCourse[course.id] || 0}
            suffix="student"
          />
        ))}
      </div>

      {/* ================= Growth Students ================= */}
      <h2 className="text-xl font-semibold mb-4">
        Growth School Students Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Students" value={studentStats.total} />
        <StatCard title="Enrolled" value={studentStats.enrolled} />
        <StatCard title="Active" value={studentStats.active} color="text-blue-400" />
        <StatCard title="Completed" value={studentStats.completed} color="text-green-400" />
      </div>

      {/* ================= Job Seekers ================= */}
      <h2 className="text-xl font-semibold mb-4">
        Job Seekers Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Job Seekers" value={jobStats.total} />
        <StatCard title="Interview" value={jobStats.interview} color="text-yellow-400" />
        <StatCard title="Placed" value={jobStats.placed} color="text-green-400" />
        <StatCard title="Rejected" value={jobStats.rejected} color="text-red-400" />
      </div>
    </div>
  );
}

/* ================= Reusable Components ================= */

function Card({
  title,
  value,
  suffix,
}: {
  title: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5">
      <div className="text-sm text-gray-400">Course</div>
      <div className="text-lg font-semibold mt-1">{title}</div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-gray-400 mb-1">{suffix}</span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5">
      <div className="text-sm text-gray-400">{title}</div>
      <div className={`text-3xl font-bold mt-3 ${color}`}>
        {value}
      </div>
    </div>
  );
}
