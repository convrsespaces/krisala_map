
// import React, { useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';

// const Earth_Video = () => {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);

//   useEffect(() => {
//     const video = videoRef.current;

//     const handleVideoEnd = () => {
//       console.log('Video ended, navigating to /twentykm');
//       navigate('/thirtyfive');
//     };

//     const handleCanPlay = () => {
//       console.log('Video can play, attempting auto-play');
//       video
//         .play()
//         .then(() => {
//           console.log('Video auto-play started successfully');
//         })
//         .catch((error) => {
//           console.error('Auto-play failed:', error);
//           // No UI fallback; log error and attempt navigation after delay
//           setTimeout(() => {
//             console.log('Auto-play failed, navigating to /twentykm as fallback');
//             navigate('/thirtyfive');
//           }, 2000);
//         });
//     };

//     const handleError = (e) => {
//       console.error('Video playback error:', e.target.error);
//       // Navigate to /twentykm on error to avoid stuck screen
//       setTimeout(() => {
//         console.log('Video error, navigating to /twentykm');
//         navigate('/twentykm');
//       }, 2000);
//     };

//     video.addEventListener('ended', handleVideoEnd);
//     video.addEventListener('canplay', handleCanPlay);
//     video.addEventListener('error', handleError);

//     // Attempt to load video immediately
//     video.load();

//     return () => {
//       video.removeEventListener('ended', handleVideoEnd);
//       video.removeEventListener('canplay', handleCanPlay);
//       video.removeEventListener('error', handleError);
//     };
//   }, [navigate]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         key="earth-video"
//         initial={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1, delay: 1 }}
//         style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}
//       >
//         <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
//           <video
//             ref={videoRef}
//             muted
//             playsInline
//             autoPlay
//             preload="auto"
//             className="w-full h-full"
//             style={{
//               width: '100%',
//               height: '100%',
//               objectFit: 'cover',
//             }}
//           >
//             <source
//             //   src="https://d1zhaax9dcu4d9.cloudfront.net/salarpuria/video/salarpuria_map.mp4"
//               src="/images/earthvideo.mp4"
//               type="video/mp4"
//             />
//           </video>
//         </div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };
// export default Earth_Video;



import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Earth_Video = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    const handleVideoEnd = () => {
      console.log('Video ended, navigating to /thirtyfive');
      navigate(`/thirtyfive${location.search || ""}`);
    };

    const handleCanPlay = () => {
      console.log('Video can play, attempting auto-play');
      video
        .play()
        .then(() => {
          console.log('Video auto-play started successfully');
        })
        .catch((error) => {
          console.error('Auto-play failed:', error);
          setTimeout(() => {
            console.log('Auto-play failed, navigating to /thirtyfive as fallback');
            navigate(`/thirtyfive${location.search || ""}`);
          }, 2000);
        });
    };

    const handleError = (e) => {
      console.error('Video playback error:', e.target.error);
      setTimeout(() => {
        console.log('Video error, navigating to /thirtyfive');
        navigate(`/thirtyfive${location.search || ""}`);
      }, 2000);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    video.load();

    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [navigate, location.search]);

  const handleSkip = () => {
    console.log('Skip button clicked, navigating to /thirtyfive');
    navigate(`/thirtyfive${location.search || ""}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="earth-video"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="relative h-screen w-screen overflow-hidden"
      >
        <div className="h-screen w-screen overflow-hidden">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source
              src="/images/earthvideo.mp4"
              type="video/mp4"
            />
          </video>
        </div>
        <motion.button
          onClick={handleSkip}
          className="absolute bottom-24 right-8 bg-white text-black font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Skip
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default Earth_Video;
