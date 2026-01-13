import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import mainBanner from '../assets/images/mainbanner.png';

function MainPage() {
    return (
        <div>
            <Navbar />

            <div className="container p-0">
                <div className='position-relative mb-5'>
                    <img 
                        src={mainBanner}
                        alt="학원 메인 배너"
                        className="w-100 h-auto"
                        style={{ filter: 'brightness(70%)'}}
                    />

                    <div className="position-absolute top-50 start-0 translate-middle-y ps-5 text-white">
                        <h1 className="display-4 fw-bold mb-3">
                            위드유
                        </h1>
                        <p className="fs-5">
                            빈틈없는 피드백<br/>
                            1:1 맞춤 교육의 힘
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default MainPage;