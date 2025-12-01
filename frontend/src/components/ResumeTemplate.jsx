import React from 'react';

export const ResumeTemplate = React.forwardRef(({ data }, ref) => {
    const {
        personal,
        education,
        skills,
        experience,
        projects,
        achievements
    } = data;

    // Helper for dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto text-black font-sans text-sm leading-normal">
            {/* HEADER */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{personal.name || 'Your Name'}</h1>
                <div className="flex justify-center items-center gap-2 text-sm">
                    {personal.phone && <span>{personal.phone}</span>}
                    {personal.phone && personal.email && <span>|</span>}
                    {personal.email && <a href={`mailto:${personal.email}`} className="hover:underline">{personal.email}</a>}
                    {personal.email && personal.linkedin && <span>|</span>}
                    {personal.linkedin && <a href={personal.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>}
                    {personal.linkedin && personal.github && <span>|</span>}
                    {personal.github && <a href={personal.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>}
                    {personal.github && personal.portfolio && <span>|</span>}
                    {personal.portfolio && <a href={personal.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>}
                </div>
            </div>

            {/* EDUCATION */}
            {education && education.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-black mb-2">Education</h2>
                    {education.map((edu, index) => (
                        <div key={index} className="mb-2">
                            <div className="flex justify-between font-bold">
                                <span>{edu.institution}</span>
                                <span>{edu.year}</span>
                            </div>
                            <div className="flex justify-between italic">
                                <span>{edu.degree} {edu.branch ? `in ${edu.branch}` : ''}</span>
                                <span>{edu.location || ''}</span>
                            </div>
                            {edu.cgpa && <div className="text-xs mt-1">CGPA: {edu.cgpa}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* SKILLS */}
            {skills && skills.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-black mb-2">Skills</h2>
                    <div className="text-sm">
                        {/* Group skills if possible, otherwise just list them */}
                        <div className="mb-1">
                            <span className="font-bold">Languages & Tools: </span>
                            <span>{skills.map(s => s.name).join(', ')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* EXPERIENCE */}
            {experience && experience.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-black mb-2">Experience</h2>
                    {experience.map((exp, index) => (
                        <div key={index} className="mb-3">
                            <div className="flex justify-between font-bold">
                                <span>{exp.role}</span>
                                <span>{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                            </div>
                            <div className="flex justify-between italic mb-1">
                                <span>{exp.company}</span>
                                <span>{exp.location}</span>
                            </div>
                            <ul className="list-disc ml-5 text-sm space-y-0.5">
                                {exp.description && exp.description.split('\n').map((line, i) => (
                                    line.trim() && <li key={i}>{line.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* PROJECTS */}
            {projects && projects.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-black mb-2">Projects</h2>
                    {projects.map((proj, index) => (
                        <div key={index} className="mb-3">
                            <div className="flex justify-between font-bold">
                                <span>{proj.title}</span>
                                <span>{formatDate(proj.date)}</span>
                            </div>
                            <div className="italic mb-1">
                                {proj.techStack && <span>{proj.techStack}</span>}
                                {proj.link && (
                                    <>
                                        <span className="mx-1">|</span>
                                        <a href={proj.link} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">Link</a>
                                    </>
                                )}
                            </div>
                            <ul className="list-disc ml-5 text-sm space-y-0.5">
                                {proj.description && proj.description.split('\n').map((line, i) => (
                                    line.trim() && <li key={i}>{line.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* ACHIEVEMENTS / EXTRACURRICULAR */}
            {achievements && achievements.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold uppercase border-b border-black mb-2">Achievements & Extracurricular</h2>
                    <ul className="list-disc ml-5 text-sm space-y-1">
                        {achievements.map((ach, index) => (
                            <li key={index}>
                                <span className="font-bold">{ach.title}</span>
                                {ach.role && <span> - {ach.role}</span>}
                                {ach.description && <span>: {ach.description}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
});

ResumeTemplate.displayName = 'ResumeTemplate';
