import Link from "next/link";

export default function About() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-between p-24">
      <h1>About</h1>
      <div className="flex-grow">
        <p>This website helps answer questions like</p>
        <ul className="list-disc ml-4">
          <li>
            <Link href="?services=ec2&action=*&accessLevel=w">
              What are all the write-level IAM actions that AWS EC2 exposes?
            </Link>
          </li>
          <li>
            <Link href="/advanced?action=*vpc*&limit=-1">
              What are all the IAM actions with &quot;VPC&quot; in their name?
            </Link>
          </li>
          <li>
            <Link href="/?q=sso">
              AWS SSO disappeared; what happened to the <code>sso</code> IAM
              actions?
            </Link>
          </li>
          <li>
            <Link href="/advanced?action=get*&accessLevel=wtp">
              Are there any write-level IAM actions that are matched by "Get*"?
            </Link>
          </li>
        </ul>
        <br />
        <hr />
        <br />
        <p>
          Built with React via Next.js, Tailwind CSS, and Cloudflare Pages, and
          Cloudflare D1.
        </p>
        <p>
          Source and the underlying data can be found at{" "}
          <a href="https://github.com/skalt/aws_iam_actions">
            https://github.com/skalt/aws_iam_actions
          </a>
          . Please send any copyright complaints and takedown requests to{" "}
          <a href="mailto:dmca@kalt.cloud">dmca@kalt.cloud</a>.
        </p>
      </div>
    </main>
  );
}
