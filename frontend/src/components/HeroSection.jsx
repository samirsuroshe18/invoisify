import { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSpring, animated } from 'react-spring';
import { FaArrowDown } from 'react-icons/fa';
import { Link } from 'react-scroll';
import AOS from 'aos';
import 'aos/dist/aos.css';
import heroImg from '../assets/heroimg.jpg';

const HeroSection = () => {
  const isIn = useSelector((state) => state.auth.status === 'in');
  const props = useSpring({
    opacity: 1,
    transform: 'translateY(0)',
    from: { opacity: 0, transform: 'translateY(50px)' },
    config: { tension: 250, friction: 25 },
  });

  useEffect(() => {
    AOS.init({
      duration: 1200, 
      easing: 'ease-in-out',
    });
  }, []);

  return (
    <section className="relative w-full min-h-[calc(100vh-3.5rem)]">
  <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 lg:px-16 py-16 max-w-screen-xl mx-auto">
    
    <div className="flex items-center justify-between w-full">
      {/* Text Section */}
      <div className="w-full lg:w-1/2 text-center lg:text-left">
        <animated.div style={props} data-aos="fade-up" className="space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Manage Your Invoices with Ease
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Create professional invoices in a minute, send them to your customers and always know what has been paid and what is overdue.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            <RouterLink
              to={isIn ? '/dashboard' : '/login'}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
            >
              {isIn ? 'Open your dashboard' : 'Try the demo'}
            </RouterLink>
            <Link
              to="features"
              href="#features"
              smooth={true}
              offset={-70}
              duration={500}
              className="inline-block px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300 cursor-pointer"
            >
              Explore features
            </Link>
          </div>
        </animated.div>
      </div>

      {/* Hero Image */}
      <div className="hidden lg:block w-full lg:w-1/2 flex justify-center">
        <img
          src={heroImg}
          alt=""
          className="w-4/5 h-[450px] object-cover"
          data-aos="fade-left"
        />
      </div>
    </div>
  </div>
  {/* Arrow Down */}
  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
    <Link to="features" href="#features" aria-label="Go to the features" smooth={true} offset={-70} duration={500} className="cursor-pointer">
      <div className="text-center text-blue-600">
        <FaArrowDown className="text-3xl animate-bounce" />
      </div>
    </Link>
  </div>
</section>

  );
};

export default HeroSection;
