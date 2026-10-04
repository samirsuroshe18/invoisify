import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Features from "../components/Features";
import Reviews from "../components/Reviews";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="bg-white">
      <Navbar />
      <HeroSection />
      <Features />
      <Reviews />
      <Footer />
    </div>
  );
};

export default Home;
