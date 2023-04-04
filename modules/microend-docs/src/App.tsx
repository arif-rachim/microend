import imageOne from "./images/1.png";
import imageTwo from "./images/2.png";
import imageThree from "./images/3.png";
import backgroundPattern from "./images/background-pattern.png";
import "./App.style.css";
export function App() {
    return <main>
        <section style={{backgroundImage:`url(${backgroundPattern})`,color:'white',padding:10}}>
            <article>
                <div style={{display:'flex',alignItems:'center'}} >
                    <svg height="32" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 375 374.999991"
                         width="32" xmlns="http://www.w3.org/2000/svg" zoomAndPan="magnify">
                        <defs>
                            <clipPath id="914761307b">
                                <path clipRule="nonzero" d="M 33 15 L 343.125 15 L 343.125 354 L 33 354 Z M 33 15 "/>
                            </clipPath>
                        </defs>
                        <g clipPath="url(#914761307b)">
                            <path
                                d="M 64.996094 96.972656 L 145.175781 56.617188 C 145.175781 56.617188 171.277344 41.71875 177.1875 30.847656 C 177.1875 30.847656 199.253906 55.996094 163.824219 77.722656 L 72.460938 123.042969 C 72.460938 123.042969 46.972656 136.703125 50.707031 163.398438 C 50.707031 163.398438 9.683594 128.636719 64.996094 96.972656 Z M 50.707031 223 C 46.972656 196.308594 72.460938 182.648438 72.460938 182.648438 L 163.824219 137.328125 C 199.246094 115.597656 177.1875 90.453125 177.1875 90.453125 C 171.285156 101.3125 145.175781 116.21875 145.175781 116.21875 L 64.996094 156.566406 C 9.683594 188.234375 50.707031 223 50.707031 223 Z M 69.96875 244.730469 L 161.332031 199.414062 C 196.753906 177.683594 174.695312 152.539062 174.695312 152.539062 C 168.792969 163.398438 142.683594 178.304688 142.683594 178.304688 L 62.511719 218.652344 C 7.195312 250.316406 48.21875 285.082031 48.21875 285.082031 C 44.488281 258.386719 69.96875 244.730469 69.96875 244.730469 Z M 253.335938 90.804688 L 247.605469 192.539062 C 248.996094 234.042969 281.792969 227.316406 281.792969 227.316406 C 275.25 216.820312 275.1875 186.78125 275.1875 186.78125 L 279.714844 97.21875 C 279.507812 33.539062 228.972656 51.96875 228.972656 51.96875 C 254.042969 61.933594 253.335938 90.804688 253.335938 90.804688 Z M 199.890625 57.28125 L 194.160156 159.015625 C 195.550781 200.519531 228.34375 193.792969 228.34375 193.792969 C 221.804688 183.296875 221.742188 153.257812 221.742188 153.257812 L 226.265625 63.695312 C 226.058594 0.015625 175.527344 18.445312 175.527344 18.445312 C 200.597656 28.410156 199.890625 57.28125 199.890625 57.28125 Z M 305.546875 121.226562 L 299.816406 222.960938 C 301.207031 264.464844 334 257.738281 334 257.738281 C 327.457031 247.242188 327.398438 217.203125 327.398438 217.203125 L 331.921875 127.640625 C 331.714844 63.957031 281.183594 82.390625 281.183594 82.390625 C 306.25 92.351562 305.546875 121.226562 305.546875 121.226562 Z M 297.171875 264 L 212.066406 207.8125 C 175.472656 188.117188 164.769531 219.792969 164.769531 219.792969 C 177.144531 219.441406 203.148438 234.511719 203.148438 234.511719 L 278.332031 283.53125 C 333.515625 315.429688 343.023438 262.535156 343.023438 262.535156 C 321.785156 279.160156 297.171875 264 297.171875 264 Z M 241.230469 293.796875 L 156.125 237.609375 C 119.53125 217.914062 108.832031 249.59375 108.832031 249.59375 C 121.207031 249.238281 147.210938 264.3125 147.210938 264.3125 L 222.390625 313.324219 C 277.578125 345.222656 287.085938 292.324219 287.085938 292.324219 C 265.84375 308.960938 241.230469 293.796875 241.230469 293.796875 Z M 189.023438 323.597656 L 103.917969 267.410156 C 67.324219 247.710938 56.621094 279.390625 56.621094 279.390625 C 69 279.039062 95.003906 294.109375 95.003906 294.109375 L 170.183594 343.121094 C 225.367188 375.019531 234.878906 322.125 234.878906 322.125 C 213.636719 338.757812 189.023438 323.597656 189.023438 323.597656 Z M 189.023438 323.597656 "
                                fill="#FFFFFF"
                                fillOpacity="1" fillRule="nonzero"/>
                        </g>
                    </svg>
                    <h1 style={{marginLeft: 20,color:'white'}}>MicroEnd</h1>
                </div>
                <p style={{fontStyle: 'italic', fontWeight: 500}}>A MicroEnd is a web application composed of small
                    modules
                    that
                    are hosted on the end-user's device.</p>
            </article>
        </section>
        <article >
            <p>The word MicroEnd was derived from the concept of installing a web application feature offline using
                modules
                hosted on end-user's device <b>(Micro module at End user)</b>. These micro modules can communicate with
                one
                another. A MicroEnd module is an HTML page that
                can be developed by any javascript framework. All assets and javascript code are then bundled into a
                single
                HTML
                page. This makes it simple to distribute MicroEnd modules offline.</p>
            <p>MicroEnd WebApp can function even when it is not connected to the internet/server. The MicroEnd router
                web component facilitates lifecycle management as well as communication between modules. Modules may be
                constructed
                using any JavaScript framework of the developer's preference.
            </p>
            <h4>Modular</h4>
            <p>Click on
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 96 960 960" fill="#9F2D2D"
                     opacity="1">
                    <path
                        d="M480 976q-82 0-155-31.5t-127.5-86Q143 804 111.5 731T80 576q0-83 31.5-156t86-127Q252 239 325 207.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 82-31.5 155T763 858.5q-54 54.5-127 86T480 976Zm0-120q117 0 198.5-82T760 576q0-117-81.5-198.5T480 296q-116 0-198 81.5T200 576q0 116 82 198t198 82Zm0 40q134 0 227-93.5T800 576q0-134-93-227t-227-93q-133 0-226.5 93T160 576q0 133 93.5 226.5T480 896Z"/>
                </svg>
                to view the list of available
                modules for installation. These modules were developed independently using various JavaScript
                frameworks,
                including React, Svelte, Vue, and Angular; however, they are still able to communicate with one another.
                These
                modules can also be downloaded and installed into MicroEnd WebApp in an offline mode, which is one of
                the interesting features that the platform offers. Because of this, the WebApp can be updated with
                greater flexibility, even when there is no internet or network connection.
            </p>
            <h4>How it works</h4>
            <p><code>microend-router</code> is a web component that is considered to be the core of a MicroEnd WebApp.
                The
                <code>microend-router</code> serves as a routing engine that renders pages based on the routing
                information
                user provided in the url address bar or when a module uses the <code>navigateTo</code> function to
                programmatically call another module. a
                <code>microend-router</code> web component, serves to navigate between modules, invoke the module's
                lifecycle, and facilitate communication between modules.
            </p>
            <h4>Use cases</h4>
            <p>MicroEnds are not designed to be used on websites that benefit from having search engines crawl through
                their
                content. The MicroEnd platform is primarily designed for the construction of large, modular, and
                offline-capable
                software applications. The following is an illustration of a use case that can be implemented with a
                microend:</p>
            <h5>ERP Software</h5>
            <img src={imageOne} alt={'ERP Logo'}/>
            <p>
                ERP software typically requires a large number of developers, each of whom brings a unique skill set, as
                well as a significant amount of time to develop the application. The issue is that the front-end
                framework technology is constantly evolving to keep up with changing times. This is the source of the
                problem. Developing applications on a modular basis makes it simpler to incorporate new technologies at
                a later date without necessitating the redevelopment of previously developed modules.
            </p>

            <h5>Humanitarian Aid</h5>
            <img src={imageThree} alt={'Humanitarian Logo'}/>
            <p>You are part of a humanitarian organization that provides assistance to people who have been
                affected by natural disasters. The inability to connect to the internet, which forces you to carry out
                your work without it, is a common obstacle. Thankfully, your app has the ability to work offline first.
                You should, however, be able to obtain the most recent features after working for some time, as well as
                any updates that have not yet been installed in your application. Since microend modules can be
                installed offline, the logistics team that regularly visits you can assist you at your location and give
                you modules that you haven't already installed on your device. This is possible because microend modules
                can be installed offline.
            </p>

            <h5>Defence</h5>
            <img src={imageTwo} alt={'Defence Logo'}/>
            <p>If you work on the front lines of the defence, it's possible that you won't be able to communicate online
                with
                the command center for a variety of reasons, despite the fact that this scenario is extremely unlikely
                to
                play
                out. This will provide a wider variety of options for sending data to your command base by providing an
                offline
                encryption feature that is both up to date and modular in its design.</p>
        </article>
    </main>
}