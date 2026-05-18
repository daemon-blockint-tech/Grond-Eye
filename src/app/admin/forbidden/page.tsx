import Link from "next/link";

export default function AdminForbiddenPage() {
    return (
      <div style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Access denied</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 400, textAlign: "center" }}>
          You do not have permission to view Grond Admin. Contact an administrator if you need access.
        </p>
        <Link href="/ops" className="btn btn--glow">Return to Operations</Link>
      </div>
    );
}
