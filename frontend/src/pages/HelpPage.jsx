import { Card, PageHeader } from "../components";

export function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help & Support"
        title="Support Desk"
        description="FAQ, guides, contact, feedback, and quick links."
      />
      <div className="content-grid split">
        {["FAQ", "Guides", "Contact us", "Feedback", "Quick links"].map(
          (title) => (
            <Card key={title} title={title} label="Support">
              <p className="muted-text">
                Reference material for keeping the discipline system
                operational.
              </p>
            </Card>
          ),
        )}
      </div>
    </>
  );
}
