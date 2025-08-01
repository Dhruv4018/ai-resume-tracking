import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, auth.isAuthenticated, id]);

  useEffect(() => {
    let resumeBlobUrl: string;
    let imageBlobUrl: string;

    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      resumeBlobUrl = URL.createObjectURL(new Blob([resumeBlob], { type: "application/pdf" }));
      setResumeUrl(resumeBlobUrl);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;

      imageBlobUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageBlobUrl);

      setFeedback(data.feedback);
      console.log({ resumeUrl: resumeBlobUrl, imageUrl: imageBlobUrl, feedback: data.feedback });
    };

    loadResume();

    return () => {
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    };
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border w-[60%] max-md:w-[80%] max-sm:w-[95%]">
              <a href={resumeUrl}>
                <img
                  src={imageUrl}
                  className="w-full h-auto object-contain rounded-2xl shadow-xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section px-4 py-6">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS?.score || 0} suggestions={feedback.ATS?.tips || []} />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" alt="resume-scan" />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
