import Link from "next/link";

export default function About() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-between p-24">
      <h1>About</h1>
      <div className="flex-grow">
        <p>This website helps answer questions like</p>
        <ul className="list-disc ml-4">
          <li>
            <Link href="/advanced?services=ec2&accessLevel=w">
              What are all the write-level IAM actions that AWS EC2 exposes?
            </Link>
          </li>
          <li>
            <Link href="/advanced?action=vpc&limit=-1">
              What are all the IAM actions with &quot;VPC&quot; in their name?
            </Link>
          </li>
          <li>
            <Link href="/?q=sso">
              AWS SSO disappeared; what happened to the <code>sso</code> IAM
              actions?
            </Link>
          </li>
        </ul>
        <p>
          Built with React via Next.js, Tailwind CSS, and Cloudflare Pages, and
          Cloudflare D1.
        </p>
        <p>
          Source and the underlying data can be found at{" "}
          <a href="https://github.com/skalt/aws_iam_actions">
            https://github.com/skalt/aws_iam_actions
          </a>
        </p>
      </div>
    </main>
  );
}
