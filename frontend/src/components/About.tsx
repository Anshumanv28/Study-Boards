import React from "react";
import "./About.css";

const About: React.FC = () => (
  <div className="about-container">
    <div className="about-hero">
      <h1>About Study Boards</h1>
      <p className="about-subtitle">
        Your comprehensive resource for mastering Study Boardsematics
      </p>
    </div>

    <div className="about-content">
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Study Boards is dedicated to helping students succeed in Boards
          Mathematics by providing high-quality, free resources and practice
          materials. Our mission is to make Boards preparation accessible to
          everyone, regardless of their background or financial situation.
        </p>
        <p>
          We believe that every student deserves the opportunity to excel in
          their academic journey, and we're committed to providing the tools and
          support needed to achieve their goals.
        </p>
      </section>

      <section className="about-section">
        <h2>What We Offer</h2>
        <div className="offerings-grid">
          <div className="offering-card">
            <div className="offering-icon">📚</div>
            <h3>Comprehensive Study Materials</h3>
            <p>
              Access to detailed revision notes, practice questions, and video
              tutorials covering all Study Boards topics from basic algebra to
              advanced trigonometry.
            </p>
          </div>

          <div className="offering-card">
            <div className="offering-icon">🎯</div>
            <h3>Targeted Practice</h3>
            <p>
              Practice questions organized by topic and difficulty level, with
              instant feedback and detailed explanations to help you understand
              your mistakes.
            </p>
          </div>

          <div className="offering-card">
            <div className="offering-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>
              Monitor your improvement with detailed analytics, identify your
              weak areas, and focus your study efforts where they'll have the
              most impact.
            </p>
          </div>

          <div className="offering-card">
            <div className="offering-icon">🆓</div>
            <h3>Completely Free</h3>
            <p>
              All our resources are completely free to access. No hidden costs,
              no premium subscriptions - just quality education for everyone.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Our Approach</h2>
        <div className="approach-grid">
          <div className="approach-item">
            <h3>🎓 Evidence-Based Learning</h3>
            <p>
              Our materials are designed based on proven educational research
              and the latest Boards exam patterns to ensure maximum
              effectiveness.
            </p>
          </div>

          <div className="approach-item">
            <h3>🔍 Personalized Experience</h3>
            <p>
              Track your progress and receive personalized recommendations based
              on your performance and learning patterns.
            </p>
          </div>

          <div className="approach-item">
            <h3>📱 Accessible Design</h3>
            <p>
              Study anywhere, anytime with our mobile-friendly platform that
              works seamlessly across all devices and screen sizes.
            </p>
          </div>

          <div className="approach-item">
            <h3>🔄 Continuous Improvement</h3>
            <p>
              We regularly update our content based on student feedback and the
              latest exam changes to ensure you have the most current materials.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Study Boards Topics Covered</h2>
        <div className="topics-list">
          <div className="topic-category">
            <h3>📐 Algebra</h3>
            <ul>
              <li>Linear equations and inequalities</li>
              <li>Functions and their graphs</li>
              <li>Systems of equations</li>
              <li>Quadratic functions and equations</li>
              <li>Polynomial expressions</li>
            </ul>
          </div>

          <div className="topic-category">
            <h3>📏 Geometry</h3>
            <ul>
              <li>Lines, angles, and triangles</li>
              <li>Circles and arcs</li>
              <li>Polygons and quadrilaterals</li>
              <li>Coordinate geometry</li>
              <li>Transformations and symmetry</li>
            </ul>
          </div>

          <div className="topic-category">
            <h3>🔢 Advanced Math</h3>
            <ul>
              <li>Complex numbers</li>
              <li>Trigonometric functions</li>
              <li>Exponential and logarithmic functions</li>
              <li>Polynomial functions</li>
              <li>Rational expressions</li>
            </ul>
          </div>

          <div className="topic-category">
            <h3>📊 Problem Solving & Data Analysis</h3>
            <ul>
              <li>Statistics and data interpretation</li>
              <li>Probability concepts</li>
              <li>Ratios, proportions, and percentages</li>
              <li>Rates and unit conversions</li>
              <li>Graphical data analysis</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Contact & Support</h2>
        <div className="contact-info">
          <p>
            We're here to help you succeed! If you have any questions, feedback,
            or need support, please don't hesitate to reach out to us.
          </p>
          <div className="contact-details">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:info@StudyBoards.com">info@StudyBoards.com</a>
            </p>
            <p>
              <strong>Support:</strong> Available 24/7 through our platform
            </p>
            <p>
              <strong>Updates:</strong> Follow us for the latest content and
              exam updates
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default About;
