import HeroSection from "../components/HeroSection";
import CampusMap from "../components/CampusMap";
import FacilityGrid from "../components/FacilityGrid";

function HomePage({
  facilities,
  onSearch,
  onExplore,
  onViewLocation,
  onPlaceSelect,
  onContact,
}) {
  return (
    <>
      <HeroSection onSearch={onSearch} onExplore={onExplore} />

      <section className="section-container">
        <div className="section-heading">
          <div>
            <h2>Get to know your campus</h2>
          </div>
        </div>

        <div className="tool-links"><a className="primary-button" href="/usiu-map-review.html">Interactive 2D / 3D campus map</a><a href="/science-interior.html">Gate A to Lab H guide</a><a href="/campus-tools.html">All navigation tools</a></div><p>Illustrative preview below. Open the interactive map for sourced outlines and room search.</p><CampusMap onPlaceSelect={onPlaceSelect} />
      </section>

      <section className="section-container facilities-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EVERYDAY DESTINATIONS</span>
            <h2>Everything you need,<br />right where you need it.</h2>
            <p>From your first lecture to your favourite lunch spot, find your place on campus.</p>
          </div>
        </div>

        <FacilityGrid
          facilities={facilities}
          onViewLocation={onViewLocation}
        />
      </section>

      <section className="help-section">
        <div>
          <h2>A little less searching.<br />A lot more campus.</h2>
          <p>Built for first days, everyday journeys and everything in between. Smart Campus Navigator helps students, staff and visitors feel right at home.</p>
        </div>
        <aside className="support-card">
          <strong>Need a hand finding your way?</strong>
          <p>Campus support details are awaiting confirmation.</p>
          <button
            type="button"
            className="support-contact-link"
            onClick={onContact}
          >
            Contact campus support <span aria-hidden="true">↗</span>
          </button>
        </aside>
      </section>
    </>
  );
}

export default HomePage;