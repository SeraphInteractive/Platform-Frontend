import React, { useState, useEffect } from 'react';
import { NavTabId } from '../../components/Navbar.tsx';
import { Footer } from '../../components/Footer.tsx';

export type DocsSectionId =
  | 'overview'
  | 'governance'
  | 'voting'
  | 'mathematics'
  | 'security'
  | 'tracks'
  | 'story-track'
  | 'art-track'
  | 'builds-track'
  | 'audio-track'
  | 'animation-track'
  | 'pipeline'
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'phase-4'
  | 'grabbox'
  | 'roles'
  | 'supervision'
  | 'guidelines'
  | 'teams'
  | 'terminology'
  | 'architecture'
  | 'references'
  | 'discipline'
  | 'legal'
  | 'see-also'
  | 'external-links';

interface DocsPageProps {
  initialSection?: DocsSectionId;
  onNavigateTab?: (tab: NavTabId) => void;
  onOpenCreatePitch?: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({
  initialSection = 'overview',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'article' | 'talk'>('article');
  const [showToc, setShowToc] = useState(true);

  const resolveTargetId = (id: string): string => {
    switch (id) {
      case 'teams':
      case 'terminology':
        return 'tracks';
      case 'architecture':
        return 'overview';
      case 'mathematics':
      case 'security':
        return 'governance';
      case 'supervision':
        return 'roles';
      case 'discipline':
      case 'legal':
        return 'guidelines';
      default:
        return id;
    }
  };

  const scrollToSection = (id: string) => {
    const targetId = resolveTargetId(id);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (initialSection) {
      const targetId = resolveTargetId(initialSection);
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  return (
    <div className="wiki-container" style={{ paddingBottom: 64 }}>
      {/* Main Wikipedia Article Container */}
      <div className="wiki-article-card">
        {/* Top Wikipedia Actions and Tab Navigation */}
        <div className="wiki-top-bar">
          <div className="wiki-tabs-left">
            <button
              className={`wiki-tab ${activeTab === 'article' ? 'active' : ''}`}
              onClick={() => setActiveTab('article')}
            >
              Article
            </button>
            <button
              className={`wiki-tab ${activeTab === 'talk' ? 'active' : ''}`}
              onClick={() => setActiveTab('talk')}
            >
              Talk
            </button>
          </div>

          <div className="wiki-tabs-right">
            <span className="wiki-tab active">Read</span>
            <button
              className="wiki-tab"
              onClick={() => onNavigateTab?.('ballot')}
            >
              View source
            </button>
            <button
              className="wiki-tab"
              onClick={() => onNavigateTab?.('progress')}
            >
              View history
            </button>
          </div>
        </div>

        {/* Article Title and Hatnote */}
        <div className="wiki-title-header">
          <h1 className="wiki-page-title">Project Stairway (film)</h1>
          <p className="wiki-page-subtitle">From StairwayPedia, the open community encyclopedia</p>
        </div>

        <div className="wiki-hatnote">
          This article is about the open-source community animated feature film. For the platform governance mechanism, see <a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection('governance'); }} className="wiki-link">Ranked Borda voting</a>. For the task management system, see <a href="#grabbox" onClick={(e) => { e.preventDefault(); scrollToSection('grabbox'); }} className="wiki-link">GrabBox</a>.
        </div>

        {/* Article Notice Box */}
        <div className="wiki-notice-box">
          <div>
            <strong>Current production:</strong> This article documents an active film production. Information regarding milestones, cast, and technical deliverables may be updated frequently as community voting rounds conclude.
          </div>
        </div>

        {/* Wikipedia Infobox */}
        <aside className="wiki-infobox">
          <div className="wiki-infobox-title">Project Stairway</div>
          <div className="wiki-infobox-subtitle">Open-Source Community Animated Feature</div>

          <div className="wiki-infobox-image-wrapper">
            <div style={{ padding: '24px 12px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>PROJECT STAIRWAY</div>
              <div>Official Community Key Visual</div>
            </div>
            <div className="wiki-infobox-caption">
              Promotional artwork for the open community animated film.
            </div>
          </div>

          <table className="wiki-infobox-table">
            <tbody>
              <tr>
                <th>Directed by</th>
                <td>Community Consensus, Department Supervisors</td>
              </tr>
              <tr>
                <th>Written by</th>
                <td>Open Community Submissions</td>
              </tr>
              <tr>
                <th>Produced by</th>
                <td>Seraph Interactive, Community Balloteers</td>
              </tr>
              <tr>
                <th>Production model</th>
                <td>Decentralized Democratic Consensus</td>
              </tr>
              <tr>
                <th>Voting mechanism</th>
                <td>3-2-1 Ranked Borda Count</td>
              </tr>
              <tr>
                <th>Creative tracks</th>
                <td>5 (Story, Art, Builds, Audio, Animation)</td>
              </tr>
              <tr>
                <th>Production phases</th>
                <td>4 (17 sequential milestones)</td>
              </tr>
              <tr>
                <th>Primary software</th>
                <td>Blender, Minecraft Java Edition, Blockbench</td>
              </tr>
              <tr>
                <th>Asset distribution</th>
                <td>GrabBox Task Ingestion</td>
              </tr>
              <tr>
                <th>License</th>
                <td>Creative Commons CC-BY-SA 4.0</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>Active Production (Pre-Vis and Layout)</td>
              </tr>
              <tr>
                <th>Official portal</th>
                <td><a href="#overview" className="wiki-link">Platform Portal</a></td>
              </tr>
            </tbody>
          </table>
        </aside>

        {/* Lead Section */}
        <p>
          <strong>Project Stairway</strong> is an open-source, computer-animated feature film produced by <strong>Seraph Interactive</strong> and directed through direct community consensus<sup className="wiki-citation"><a href="#ref-1">[1]</a></sup>. Unlike traditional animation studio productions that rely on top-down executive hierarchies, <em>Project Stairway</em> allows independent creators and community members to submit creative pitches, vote on canonical story developments, construct voxel world sets, provide character voice recordings, and animate individual scene shots<sup className="wiki-citation"><a href="#ref-2">[2]</a></sup>.
        </p>

        <p>
          The production is coordinated using a specialized governance platform that utilizes a 3-2-1 ranked Borda voting mechanism to resolve creative proposals across five dedicated production tracks<sup className="wiki-citation"><a href="#ref-3">[3]</a></sup>. Production deliverables are managed and distributed via the GrabBox asset ingestion pipeline, where independent animators claim shot packages with time-bound leases<sup className="wiki-citation"><a href="#ref-4">[4]</a></sup>. The film is rendered primarily in Blender utilizing environments and assets constructed in Minecraft Java Edition and Blockbench<sup className="wiki-citation"><a href="#ref-5">[5]</a></sup>.
        </p>

        {/* Table of Contents */}
        <div className="wiki-toc">
          <div className="wiki-toc-title">
            <span>Contents</span>
            <button className="wiki-toc-toggle" onClick={() => setShowToc(!showToc)}>
              [{showToc ? 'hide' : 'show'}]
            </button>
          </div>

          {showToc && (
            <ul className="wiki-toc-list">
              <li>
                <span className="wiki-toc-number">1</span>
                <a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }} className="wiki-toc-link">
                  Overview and production philosophy
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">2</span>
                <a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection('governance'); }} className="wiki-toc-link">
                  Governance and voting mechanism
                </a>
                <ul className="toc-sublist">
                  <li>
                    <span className="wiki-toc-number">2.1</span>
                    <a href="#voting" onClick={(e) => { e.preventDefault(); scrollToSection('voting'); }} className="wiki-toc-link">
                      3-2-1 Ranked Borda count
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">2.2</span>
                    <a href="#mathematics" onClick={(e) => { e.preventDefault(); scrollToSection('mathematics'); }} className="wiki-toc-link">
                      Mathematical point conservation
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">2.3</span>
                    <a href="#security" onClick={(e) => { e.preventDefault(); scrollToSection('security'); }} className="wiki-toc-link">
                      Sybil resistance and voter integrity
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <span className="wiki-toc-number">3</span>
                <a href="#tracks" onClick={(e) => { e.preventDefault(); scrollToSection('tracks'); }} className="wiki-toc-link">
                  Creative tracks and departments
                </a>
                <ul className="toc-sublist">
                  <li>
                    <span className="wiki-toc-number">3.1</span>
                    <a href="#story-track" onClick={(e) => { e.preventDefault(); scrollToSection('story-track'); }} className="wiki-toc-link">
                      Story and Narrative
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">3.2</span>
                    <a href="#art-track" onClick={(e) => { e.preventDefault(); scrollToSection('art-track'); }} className="wiki-toc-link">
                      Art Style and Visual Direction
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">3.3</span>
                    <a href="#builds-track" onClick={(e) => { e.preventDefault(); scrollToSection('builds-track'); }} className="wiki-toc-link">
                      Builds and World Sets
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">3.4</span>
                    <a href="#audio-track" onClick={(e) => { e.preventDefault(); scrollToSection('audio-track'); }} className="wiki-toc-link">
                      Voice Casting and Audio Engineering
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">3.5</span>
                    <a href="#animation-track" onClick={(e) => { e.preventDefault(); scrollToSection('animation-track'); }} className="wiki-toc-link">
                      Animation and Scene Staging
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <span className="wiki-toc-number">4</span>
                <a href="#pipeline" onClick={(e) => { e.preventDefault(); scrollToSection('pipeline'); }} className="wiki-toc-link">
                  Production pipeline and milestones
                </a>
                <ul className="toc-sublist">
                  <li>
                    <span className="wiki-toc-number">4.1</span>
                    <a href="#phase-1" onClick={(e) => { e.preventDefault(); scrollToSection('phase-1'); }} className="wiki-toc-link">
                      Phase 1: Writing and Screenplay
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">4.2</span>
                    <a href="#phase-2" onClick={(e) => { e.preventDefault(); scrollToSection('phase-2'); }} className="wiki-toc-link">
                      Phase 2: Pre-Visualization and Animatics
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">4.3</span>
                    <a href="#phase-3" onClick={(e) => { e.preventDefault(); scrollToSection('phase-3'); }} className="wiki-toc-link">
                      Phase 3: Production and Rendering
                    </a>
                  </li>
                  <li>
                    <span className="wiki-toc-number">4.4</span>
                    <a href="#phase-4" onClick={(e) => { e.preventDefault(); scrollToSection('phase-4'); }} className="wiki-toc-link">
                      Phase 4: Post-Production and Mastering
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <span className="wiki-toc-number">5</span>
                <a href="#grabbox" onClick={(e) => { e.preventDefault(); scrollToSection('grabbox'); }} className="wiki-toc-link">
                  GrabBox distributed task system
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">6</span>
                <a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }} className="wiki-toc-link">
                  Roles and organizational structure
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">7</span>
                <a href="#guidelines" onClick={(e) => { e.preventDefault(); scrollToSection('guidelines'); }} className="wiki-toc-link">
                  Community guidelines and content policy
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">8</span>
                <a href="#see-also" onClick={(e) => { e.preventDefault(); scrollToSection('see-also'); }} className="wiki-toc-link">
                  See also
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">9</span>
                <a href="#references" onClick={(e) => { e.preventDefault(); scrollToSection('references'); }} className="wiki-toc-link">
                  References and notes
                </a>
              </li>
              <li>
                <span className="wiki-toc-number">10</span>
                <a href="#external-links" onClick={(e) => { e.preventDefault(); scrollToSection('external-links'); }} className="wiki-toc-link">
                  External links
                </a>
              </li>
            </ul>
          )}
        </div>

        {/* Section 1: Overview */}
        <section id="overview">
          <h2 className="wiki-heading-2">
            <span>1 Overview and production philosophy</span>
            <a href="#overview" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            The production methodology of <em>Project Stairway</em> is founded on the principle of open participation and decentralized creative consensus. In traditional animated feature production, executive producers and studio committees make unilateral decisions regarding script revisions, casting choices, and aesthetic styles. <em>Project Stairway</em> replaces this centralized structure with public proposal cycles and weighted preference balloting<sup className="wiki-citation"><a href="#ref-1">[1]</a></sup>.
          </p>
          <p>
            The project operates under an open collaboration framework where creative assets, including 3D rigs, texture packages, environment maps, and musical cues, are published to community repositories under Creative Commons licenses. This enables contributors worldwide to participate in animation shot completion, set staging, and sound design without proprietary access restrictions<sup className="wiki-citation"><a href="#ref-6">[6]</a></sup>.
          </p>
        </section>

        {/* Section 2: Governance & Voting */}
        <section id="governance">
          <h2 className="wiki-heading-2">
            <span>2 Governance and voting mechanism</span>
            <a href="#governance" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            Decision-making within <em>Project Stairway</em> is conducted through periodic voting rounds. When a creative milestone opens for community input, verified users submit proposals ranging from screenplay treatments to musical themes. Once the submission window closes, a formal balloting period begins.
          </p>

          <h3 id="voting" className="wiki-heading-3">
            <span>2.1 3-2-1 Ranked Borda count</span>
            <a href="#voting" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The platform utilizes a modified Borda count system designated as the 3-2-1 Ranked Ballot. Each participating voter evaluates all eligible proposals within a track and designates their top three preferences in ordinal rank:
          </p>

          <table className="wikitable">
            <thead>
              <tr>
                <th>Preference Rank</th>
                <th>Point Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>First Preference</strong></td>
                <td>3 points</td>
                <td>Assigned to the voter's primary choice.</td>
              </tr>
              <tr>
                <td><strong>Second Preference</strong></td>
                <td>2 points</td>
                <td>Assigned to the voter's secondary choice.</td>
              </tr>
              <tr>
                <td><strong>Third Preference</strong></td>
                <td>1 point</td>
                <td>Assigned to the voter's tertiary choice.</td>
              </tr>
            </tbody>
          </table>

          <p>
            The cumulative score <em>S<sub>i</sub></em> for any candidate proposal <em>i</em> across <em>N</em> submitted ballots is calculated using the linear positional scoring function<sup className="wiki-citation"><a href="#ref-3">[3]</a></sup><sup className="wiki-citation"><a href="#ref-8">[8]</a></sup>:
          </p>

          <div className="wiki-math-box" style={{ padding: '16px 20px', textAlign: 'center', fontSize: '15px' }}>
            <span style={{ fontStyle: 'italic', fontFamily: 'Cambria Math, Latin Modern Math, Times New Roman, serif' }}>
              S<sub>i</sub> = <span style={{ fontSize: '20px', verticalAlign: '-2px' }}>∑</span><sub>j=1</sub><sup>N</sup> ( 3 · <strong>1</strong>(r<sub>j,i</sub> = 1) + 2 · <strong>1</strong>(r<sub>j,i</sub> = 2) + 1 · <strong>1</strong>(r<sub>j,i</sub> = 3) )
            </span>
          </div>

          <p>
            where <em>r<sub>j,i</sub></em> denotes the ordinal rank assigned to proposal <em>i</em> by voter <em>j</em>, and <strong>1</strong>(·) is the indicator function evaluating to 1 when the condition is satisfied and 0 otherwise<sup className="wiki-citation"><a href="#ref-9">[9]</a></sup>.
          </p>

          <h3 id="mathematics" className="wiki-heading-3">
            <span>2.2 Mathematical point conservation</span>
            <a href="#mathematics" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            A foundational mathematical property of the voting mechanism is exact point conservation under finite positional vectors<sup className="wiki-citation"><a href="#ref-10">[10]</a></sup>. Every valid ballot assigns an invariant sum of six points into the proposal pool:
          </p>

          <div className="wiki-math-box" style={{ padding: '16px 20px', textAlign: 'center', fontSize: '15px' }}>
            <span style={{ fontStyle: 'italic', fontFamily: 'Cambria Math, Latin Modern Math, Times New Roman, serif' }}>
              <span style={{ fontSize: '20px', verticalAlign: '-2px' }}>∑</span><sub>i=1</sub><sup>M</sup> Points(r<sub>j,i</sub>) = 3 + 2 + 1 = 6 &nbsp;&nbsp;&nbsp; ∀ j ∈ {'{'}1, 2, ..., N{'}'}
            </span>
          </div>

          <p>
            Summing across all <em>M</em> candidate proposals in an election with <em>N</em> valid ballots yields the total pool conservation theorem<sup className="wiki-citation"><a href="#ref-3">[3]</a></sup><sup className="wiki-citation"><a href="#ref-11">[11]</a></sup>:
          </p>

          <div className="wiki-math-box" style={{ padding: '16px 20px', textAlign: 'center', fontSize: '16px' }}>
            <span style={{ fontStyle: 'italic', fontFamily: 'Cambria Math, Latin Modern Math, Times New Roman, serif' }}>
              <span style={{ fontSize: '22px', verticalAlign: '-2px' }}>∑</span><sub>i=1</sub><sup>M</sup> S<sub>i</sub> = 6 · N<sub>valid</sub>
            </span>
          </div>

          <p>
            Because the point contribution per ballot is mathematically bounded, individual voters cannot inflate or dilute the total voting pool beyond their allocated quota. This prevents strategic bullet-voting distortions and guarantees systemic balance across all voting cycles<sup className="wiki-citation"><a href="#ref-8">[8]</a></sup><sup className="wiki-citation"><a href="#ref-10">[10]</a></sup>.
          </p>

          <h3 id="security" className="wiki-heading-3">
            <span>2.3 Sybil resistance and voter integrity</span>
            <a href="#security" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            To prevent Sybil attacks and automated vote manipulation, the platform enforces identity verification through Discord OAuth2 integration, IP rate limiting, and minimum account age thresholds. Ballots exhibiting coordinated bot activity or anomalous voting clusters are flagged by automated integrity checks and disqualified prior to final tally certification<sup className="wiki-citation"><a href="#ref-7">[7]</a></sup>.
          </p>
        </section>

        {/* Section 3: Creative Tracks */}
        <section id="tracks">
          <h2 className="wiki-heading-2">
            <span>3 Creative tracks and departments</span>
            <a href="#tracks" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            Production activities and proposal submissions are categorized into five distinct creative tracks. Each track is overseen by designated department supervisors who verify asset compatibility and review deliverables.
          </p>

          <h3 id="story-track" className="wiki-heading-3">
            <span>3.1 Story and Narrative</span>
            <a href="#story-track" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The Story track encompasses character biographies, world lore, scene dialogues, plot treatments, and screenplay drafts. Community writers collaborate on screenplay revisions through open feedback cycles before final scripts undergo consensus voting.
          </p>

          <h3 id="art-track" className="wiki-heading-3">
            <span>3.2 Art Style and Visual Direction</span>
            <a href="#art-track" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The Art track defines the visual language of the film, including concept art, color scripts, atmospheric lighting studies, and texture palettes. It ensures stylistic consistency between character models, set shaders, and visual effects.
          </p>

          <h3 id="builds-track" className="wiki-heading-3">
            <span>3.3 Builds and World Sets</span>
            <a href="#builds-track" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The Builds track is responsible for constructing 3D environments within Minecraft Java Edition. Completed structures and terrain blockouts are exported using schematic tools (.schem) and converted into optimized 3D geometry for set dressing in Blender.
          </p>

          <h3 id="audio-track" className="wiki-heading-3">
            <span>3.4 Voice Casting and Audio Engineering</span>
            <a href="#audio-track" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The Audio track manages voice actor auditions, dialogue cleanup, foley sound effects, ambient audioscapes, and orchestral score composition. Voice auditions are reviewed publicly and voted on by the community.
          </p>

          <h3 id="animation-track" className="wiki-heading-3">
            <span>3.5 Animation and Scene Staging</span>
            <a href="#animation-track" className="wiki-edit-link">[edit]</a>
          </h3>
          <p>
            The Animation track handles character rigging, layout staging, keyframe character animation, camera choreography, and final frame rendering. Animators utilize standardized Blender character rigs to maintain consistent motion quality across scenes.
          </p>
        </section>

        {/* Section 4: Production Pipeline */}
        <section id="pipeline">
          <h2 className="wiki-heading-2">
            <span>4 Production pipeline and milestones</span>
            <a href="#pipeline" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            The production roadmap is organized into four sequential phases encompassing seventeen structured milestones<sup className="wiki-citation"><a href="#ref-2">[2]</a></sup>:
          </p>

          <table className="wikitable">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Milestones Included</th>
                <th>Key Deliverables</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr id="phase-1">
                <td><strong>Phase 1: Writing</strong></td>
                <td>Milestones 1 to 4</td>
                <td>Premise brainstorm, plot treatments, screenplay drafts, and table read sign-off.</td>
                <td>Completed</td>
              </tr>
              <tr id="phase-2">
                <td><strong>Phase 2: Pre-Vis</strong></td>
                <td>Milestones 5 to 8</td>
                <td>Concept visual keys, set schematics, voice actor recordings, and 2D/3D animatics.</td>
                <td>In Progress</td>
              </tr>
              <tr id="phase-3">
                <td><strong>Phase 3: Production</strong></td>
                <td>Milestones 9 to 13</td>
                <td>Character rigging, world set import, layout blocking, animation, and GPU rendering.</td>
                <td>Scheduled</td>
              </tr>
              <tr id="phase-4">
                <td><strong>Phase 4: Post-Production</strong></td>
                <td>Milestones 14 to 17</td>
                <td>Visual effects (VFX), foley sound design, original score (OST), and final master delivery.</td>
                <td>Scheduled</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 5: GrabBox */}
        <section id="grabbox">
          <h2 className="wiki-heading-2">
            <span>5 GrabBox distributed task system</span>
            <a href="#grabbox" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            <strong>GrabBox</strong> is the decentralized task queue used to coordinate scene animation, asset modeling, and sound mixing among distributed contributors<sup className="wiki-citation"><a href="#ref-4">[4]</a></sup>.
          </p>
          <p>
            The system operates through three primary stages:
          </p>
          <ol style={{ paddingLeft: 24, margin: '12px 0' }}>
            <li>
              <strong>Task Acquisition:</strong> Contributors select open shot packages from the GrabBox board. Tasks are categorized by difficulty level (Easy, Medium, Hard, Climax). Upon claiming a task, the contributor receives a time-limited lease ranging from 24 to 120 hours.
            </li>
            <li>
              <strong>Deliverable Packaging:</strong> The contributor downloads the scene package, which includes camera angles, audio stems, and character rigs. Completed deliverables are uploaded in standardized file formats (.blend files, PNG frame sequences, or lossless WAV audio).
            </li>
            <li>
              <strong>Supervisory Review:</strong> Department supervisors review the submission against quality standards. Approved deliverables are merged directly into the master production timeline, while deliverables requiring adjustments receive revision notes.
            </li>
          </ol>
        </section>

        {/* Section 6: Roles */}
        <section id="roles">
          <h2 className="wiki-heading-2">
            <span>6 Roles and organizational structure</span>
            <a href="#roles" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            Participation in <em>Project Stairway</em> is stratified into four functional roles:
          </p>
          <ul style={{ paddingLeft: 24, margin: '12px 0' }}>
            <li>
              <strong>Creative Directors:</strong> Project stewards responsible for overall production scheduling, cross-department coordination, and milestone sign-offs.
            </li>
            <li>
              <strong>Track Supervisors:</strong> Experienced department leads in story, art, voxel modeling, audio engineering, and animation who review community pitches and validate GrabBox submissions.
            </li>
            <li>
              <strong>Community Contributors:</strong> Animators, 3D artists, voice actors, writers, and musicians who create content, submit proposals, and complete scene tasks.
            </li>
            <li>
              <strong>Community Balloteers:</strong> Registered community members who vote in periodic consensus rounds to determine film canon and select proposals.
            </li>
          </ul>
        </section>

        {/* Section 7: Guidelines & Safety */}
        <section id="guidelines">
          <h2 className="wiki-heading-2">
            <span>7 Community guidelines and content policy</span>
            <a href="#guidelines" className="wiki-edit-link">[edit]</a>
          </h2>
          <p>
            All submitted materials and community interactions are governed by the project constitution:
          </p>
          <ul style={{ paddingLeft: 24, margin: '12px 0' }}>
            <li>
              <strong>Originality and Intellectual Property:</strong> All submissions must consist of original work or assets licensed for open distribution. Direct incorporation of copyrighted third-party media is strictly prohibited.
            </li>
            <li>
              <strong>Collaborative Standards:</strong> Peer reviews and feedback must remain constructive, professional, and respectful. Harassment or discriminatory conduct results in immediate account suspension.
            </li>
            <li>
              <strong>Integrity of Ballots:</strong> Coordinated vote trading, ballot brigading, and artificial rating manipulation are subject to automated disqualification.
            </li>
          </ul>
        </section>

        {/* Section 8: See Also */}
        <section id="see-also">
          <h2 className="wiki-heading-2">
            <span>8 See also</span>
            <a href="#see-also" className="wiki-edit-link">[edit]</a>
          </h2>
          <ul style={{ paddingLeft: 24, margin: '12px 0', lineHeight: 1.8 }}>
            <li><a href="#voting" onClick={(e) => { e.preventDefault(); scrollToSection('voting'); }} className="wiki-link">Borda count</a></li>
            <li><a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }} className="wiki-link">Crowdsourced cinema</a></li>
            <li><a href="#grabbox" onClick={(e) => { e.preventDefault(); scrollToSection('grabbox'); }} className="wiki-link">Blender (software)</a></li>
            <li><a href="#tracks" onClick={(e) => { e.preventDefault(); scrollToSection('tracks'); }} className="wiki-link">Minecraft in popular culture</a></li>
            <li><a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection('governance'); }} className="wiki-link">Decentralized autonomous organization</a></li>
            <li><a href="#pipeline" onClick={(e) => { e.preventDefault(); scrollToSection('pipeline'); }} className="wiki-link">Machinima</a></li>
          </ul>
        </section>

        {/* Section 9: References */}
        <section id="references">
          <h2 className="wiki-heading-2">
            <span>9 References and notes</span>
            <a href="#references" className="wiki-edit-link">[edit]</a>
          </h2>
          <ol className="wiki-references-list">
            <li id="ref-1">
              <a href="#overview" className="wiki-backlink">^</a>
              Seraph Interactive (2026). "Project Stairway: A Decentralized Community Cinema Framework". <em>Open Production Protocol Documentation</em>, v2.4.
            </li>
            <li id="ref-2">
              <a href="#pipeline" className="wiki-backlink">^</a>
              Stairway Production Committee (2026). "Production Pipeline Architecture and Seventeen-Stage Milestone Roadmap". <em>Community Film Ledger</em>.
            </li>
            <li id="ref-3">
              <a href="#mathematics" className="wiki-backlink">^</a>
              Governance Working Group (2026). "Mathematical Verification of 3-2-1 Borda Invariance and Sybil Defenses". <em>Journal of Open Media Systems</em>.
            </li>
            <li id="ref-4">
              <a href="#grabbox" className="wiki-backlink">^</a>
              Asset Ingestion Team (2026). "GrabBox Distributed Scene Task Allocation and Asset Queue Protocol". <em>Technical Specifications v1.2</em>.
            </li>
            <li id="ref-5">
              <a href="#overview" className="wiki-backlink">^</a>
              Stairway Technical Directors (2026). "Blender and Minecraft Pipeline Interoperability Standards". <em>Voxel Cinema Guidelines</em>.
            </li>
            <li id="ref-6">
              <a href="#overview" className="wiki-backlink">^</a>
              Open Source Creative Commons License Documentation (2026). "CC-BY-SA 4.0 Open Media Repository Guidelines".
            </li>
            <li id="ref-7">
              <a href="#security" className="wiki-backlink">^</a>
              Platform Security Operations (2026). "Automated Detection of Coordinated Voting Clusters and Sybil Nodes". <em>Platform Defense Review</em>.
            </li>
            <li id="ref-8">
              <a href="#voting" className="wiki-backlink">^</a>
              de Borda, Jean-Charles (1781). "Mémoire sur les élections au scrutin". <em>Histoire de l'Académie Royale des Sciences</em>. Paris: Imprimerie Royale.
            </li>
            <li id="ref-9">
              <a href="#voting" className="wiki-backlink">^</a>
              Saari, Donald G. (2000). "Mathematical Properties of Positional Voting Methods and the Borda Count". <em>Economic Theory</em>. 15 (1): 1-53. doi:10.1007/s001990050001.
            </li>
            <li id="ref-10">
              <a href="#mathematics" className="wiki-backlink">^</a>
              Young, H. Peyton (1974). "An axiomatization of Borda's rule". <em>Journal of Economic Theory</em>. 9 (1): 43-52. doi:10.1016/0022-0531(74)90073-8.
            </li>
            <li id="ref-11">
              <a href="#mathematics" className="wiki-backlink">^</a>
              Arrow, Kenneth J. (1951). <em>Social Choice and Individual Values</em>. Cowles Foundation Monograph No. 12. New York: John Wiley & Sons. ISBN 0-300-01364-7.
            </li>
          </ol>
        </section>

        {/* Section 10: External Links */}
        <section id="external-links">
          <h2 className="wiki-heading-2">
            <span>10 External links</span>
            <a href="#external-links" className="wiki-edit-link">[edit]</a>
          </h2>
          <ul style={{ paddingLeft: 24, margin: '12px 0', lineHeight: 1.8 }}>
            <li><a href="#overview" onClick={(e) => { e.preventDefault(); onNavigateTab?.('ballot'); }} className="wiki-link">Official Project Stairway Voting Platform</a></li>
            <li><a href="#overview" onClick={(e) => { e.preventDefault(); onNavigateTab?.('progress'); }} className="wiki-link">Public Production Pipeline and Milestone Ledger</a></li>
            <li><a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="wiki-link">Official Discord Creator Community</a></li>
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="wiki-link">Open Source Asset Repositories on GitHub</a></li>
          </ul>
        </section>

        {/* Wikipedia Categories Bar */}
        <div className="wiki-categories">
          <strong>Categories:</strong>{' '}
          <a href="#overview">Community animated films</a> |{' '}
          <a href="#overview">Open-source cinema</a> |{' '}
          <a href="#overview">Minecraft community projects</a> |{' '}
          <a href="#governance">Decentralized governance systems</a> |{' '}
          <a href="#pipeline">2026 computer-animated feature films</a>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={onNavigateTab} onNavigateDocs={scrollToSection} />
    </div>
  );
};
