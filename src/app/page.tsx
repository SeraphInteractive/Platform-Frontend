import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>Project Stairway</h1>
      <p style={{ fontStyle: "italic", color: "var(--text-muted)", marginTop: "-4px" }}>
        Guidelines
      </p>

      <fieldset className="grab-box">
        <legend>Overview</legend>
        <p>
          Project Stairway is an attempt to make a Minecraft-inspired Community Made Movie in the 3D animation medium. Other projects like it exist, most notably project Beacon, that have seen little forward progress in the last year.
        </p>
        <p>
          What makes Stairway different is that at the helm of this project is MattSquared, CEO of Squared Media. SQM is one of the largest Minecraft animation channels on YouTube, and has produced a series many of you are familiar with -{" "}
          <a
            href="https://youtu.be/yCNUP2NAt-A?si=vc9oWMB8WWdHvYwg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Songs of War
          </a>
          . With Matt’s extensive knowledge of team organization and the production pipeline, as well as many experienced contributors from the community leading this project, Stairway is aimed to fulfill the incredible vision of creating a community-made movie.
        </p>
        <p>
          Project Stairway has two goals- to produce a community made movie, and to create a positive, safe, and free learning community for any who wish to participate. Whether you’re around in the{" "}
          <a
            href="discord:///invite/vthz2zEnTT"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </a>{" "}
          to share your work and get feedback on it from more experienced artists, take part in the voting for different decisions the production team needs the community to make, or being a contributor to the project in one of its many areas of need; there is something at Project Stairway for everyone to look forward to!
        </p>
        <hr className="divider-hr" />
        <p style={{ margin: 0 }}>
          In the pages below, you’ll find the guidelines that Project Stairway operates by. How community voting is done, opportunities for individuals to contribute, what to expect from the leadership team and community throughout this process, and more! This document is still a work in progress, so please don’t hesitate to ask any questions so we can explain more concepts where needed!
        </p>
      </fieldset>

      <fieldset className="grab-box">
        <legend>Voting System</legend>
        <p>
          One of the hallmarks of Project Stairway is the community’s involvement in the creation of the movie. This is primarily done through two ways- contributing volunteer labor to the project, or by simply voting on major production decisions!
        </p>
        <p>
          We’ll take a closer look at how voting is handled in this section.
        </p>
        <p>
          Not everything in a production can be voted on. If it were- decisions would take too long to make. That being said, we still want to give you guys the agency to be able to decide on as many things as possible.
        </p>
        
        <p><strong>The voting system has been kept very simple, with four foundational rules:</strong></p>
        <ol style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>For every 2-vote poll, you may only choose 1 option.</li>
          <li>
            For any poll with 3+ options, you will have the decision to rate your top 3: 3 points will be given to your favorite pick, 2 to your second, and 1 to your third. This way you can give a weighted distribution to multiple great submissions!
          </li>
          <li>
            We will generally keep polls to 5 options or less. We want to give you guys plenty of say in the direction for this project, but also not overwhelm you with endless options to sift through.
          </li>
          <li>
            One submission per person! If you are caught botting or cheating the vote with multiple submissions, we have systems to detect that and will blacklist you from future votes. Please, be respectful, and don’t ruin both your own and others’ fun.
          </li>
        </ol>

        <p>
          With all that in mind, the leadership team is going to have to act as a filter for ideas before they hit the voting stage. Here’s a couple of made-up examples of potential case scenarios to help you understand how this will work:
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Voice Actors:</strong> We may get 50 applications for a role through CastingCallClub. Multiple of the core staff will evaluate all of the submissions with a rubric - mic quality, emotion, etc. The best 5 submissions, weighted evenly between staff ratings, will then be put up to a community vote for you all to decide the winner and who gets to fill the role.
          </li>
          <li>
            <strong>Art Styles:</strong> Many examples of existing art styles from existing animations on YouTube will be posted as reference for what style you guys want this animated movie to be created in. However, some art styles are much too difficult for a project with a lot of first-time animators and contributors to be consistent with. The selection made available will be curated to what the leadership team deems to be possible with an “inexperienced, but eager to learn team”. From those options, you guys will get to vote on which you would like the movie to be created in!
          </li>
        </ul>

        <p>
          This isn’t a “true democracy” approach, but a true democracy approach would fail. There is such a thing as too many cooks in the kitchen.
        </p>
        <p>
          There is no one perfect way to do voting, but after many hours of talks, ideas, and suggestions, we truly believe this is the best way forward for us all that strikes the balance needed to keep things moving forward quickly while still giving the community lots of influence over direction.
        </p>
        <p style={{ margin: 0 }}>
          That being said; we’ll be constantly listening to ideas and feedback from the community every step of the way, so speak up if you feel strongly about something and we’ll discuss it!
        </p>
      </fieldset>

      <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
        <Link href="/voting">
          <button type="button" className="action-btn">
            Vote &raquo;
          </button>
        </Link>
        <Link href="/grabbox">
          <button type="button" className="action-btn">
            Grab-Box &raquo;
          </button>
        </Link>
      </div>
    </div>
  );
}
