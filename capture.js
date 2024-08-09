//global variables
var parts = []
var usecases = []
let eventSource
let skip = 0
let itemsPerPage = 6
let currentPage = 1
let is_transit = false
const camerasPerPage = 4;
let currentCameraPage = 0;
let captureCameras = []
var current_wayPoint = ''
let src
let isPaginationInitialized = false;

//bootstrap modals
const part_name_request_modal = new bootstrap.Modal(document.getElementById("part-name-request-modal"))
const part_name_request_processing_modal = new bootstrap.Modal(document.getElementById("part-name-request-processing-modal"))
const connection_established_modal = new bootstrap.Modal(document.getElementById("connection-established-modal"))
const add_waypoint_modal = new bootstrap.Modal(document.getElementById("add-waypoint-modal"))
const discard_waypoint_modal = new bootstrap.Modal(document.getElementById("discard-waypoint-modal"))
const livis_data_capture_type_selection_modal = new bootstrap.Modal(document.getElementById("data-capture-type-selection-modal"))
const livis_data_capture_part_selection_modal = new bootstrap.Modal(document.getElementById("data-capture-part-selection-modal"))
const livis_data_capture_usecase_selection_modal = new bootstrap.Modal(document.getElementById("data-capture-usecase-selection-modal"))
const livis_PLC_configur_modal = new bootstrap.Modal(document.getElementById("configure-PLC-modal"))

// part_name_request_modal.show()
const urlParams = new URLSearchParams(window.location.search);
const paramName = urlParams.get('capture_type');
// console.log(urlParams, window.location, paramName)
// livis_data_capture_type_selection_modal.show()
const add_waypoint_btn = document.getElementById('add-waypoint-btn')
const waypoints_wrap = document.getElementById('waypoints-wrap')
localStorage.setItem('capture_type', paramName)

const radioButton1 = document.getElementById('radio-1');
const radioButton2 = document.getElementById('radio-2');

// Listen for changes to radioButton1
radioButton1.addEventListener('change', function () {
    if (this.checked) {
        // If radioButton1 is checked, uncheck radioButton2
        radioButton2.checked = false;
    }
});

// Listen for changes to radioButton2
radioButton2.addEventListener('change', function () {
    if (this.checked) {
        // If radioButton2 is checked, uncheck radioButton1
        radioButton1.checked = false;
    }
});

/**
 * Hides the part name request modal and shows the data capture type selection modal.
 */
const onDeclinePartRequest = () => {
    part_name_request_modal.hide()
    livis_data_capture_type_selection_modal.show()

}

/**
 * Redirects the user to the home page.
 */

function goBackHome() {
    window.location.href = '../home/home.html'
}

/**
 * Shows the part name request processing modal, waits for 2 seconds,
 * then hides the processing modal and shows the connection established modal.
 */
function acceptPartRequest() {
    part_name_request_processing_modal.show()
    setTimeout(() => {
        part_name_request_processing_modal.hide()
        connection_established_modal.show()
    }, 2000);
}
/**
 * Shows the data capture type selection modal and stores the capture type as 'golden' in local storage.
 */
function doneConnection() {
    livis_data_capture_type_selection_modal.show()
    localStorage.setItem('capture_type', 'golden')
}
if (paramName == 'golden') {
    donePartSelection()
    changeDataCaptureType('golden')
} else {
    goToPartSelection()
    changeDataCaptureType('not-golden')
}

/**
 * Fetches parts for the workstation based on the capture type ('golden' or 'not-golden'),
 * updates the UI accordingly, and handles loading state and error messages.
 */

function goToPartSelection() {
    setIsLoading(true, 'Please wait until we fetch the parts...')
    // const capture_type = localStorage.getItem('capture_type')
    const capture_type = paramName
    const user_info = JSON.parse(localStorage.getItem('livis_user_info'))
    const station_id = user_info?.inspection_station_id
    if (capture_type == 'golden') {
        get('/part_capture/get_temp_parts_for_workstation/' + station_id, async (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }

            localStorage.setItem('workstation_type', result?.data?.workstation_type)
            const workstation_type = result?.data?.workstation_type
            const waypoint_wrap = document.getElementById("waypoints-wrap")
            const start_capture_btn = document.getElementById("start-capture-btn")
            const start_cycle_btn = document.getElementById('start-cycle-btn')
            if (workstation_type == 'static') {
                // waypoint_wrap.classList.add('invisible')
                start_capture_btn.classList.remove('invisible')
                start_cycle_btn.classList.add('d-none')
            } else if (workstation_type == 'cobot') {
                console.log('cobot------>');
                // waypoint_wrap.classList.remove('invisible')
                start_capture_btn.classList.remove('invisible')
                start_capture_btn.innerText = ('Record Waypoint')
                // start_cycle_btn.remove('d-none')
            } else if (workstation_type == 'conveyor') {
                console.log('conveyor------>');
                // waypoint_wrap.classList.add('invisible')
                start_capture_btn.classList.remove('invisible')
                // start_cycle_btn.classList.remove('d-none')
            }

            livis_data_capture_type_selection_modal.hide()
            livis_data_capture_part_selection_modal.show()
            let partListHTML = ``
            const part_list_wrap = document.getElementById("part-list-wrap")
            parts = result?.data?.part_data
            //////console.log(parts)
            for (let i = 0; i < parts.length; i++) {

                partListHTML += `
                                <div class="col-md-4">
                                    <div class="livis-capture-type-selection-card" id="livis-parts-${i}" onclick="onSelectionPart('${i}')">
                                        <div class=" livis-gallery-images-wrap">
                                            <div class="livis-gallery-images">
                                            <img src="../common/image/gallery.svg" alt="">
                                            </div>
                                        </div>
                                        <div class="livis-capture-type-selection-card-text p-2">
                                            <div class="livis-capture-type-selection-card-text-heading">
                                            ${parts[i].part_name ? parts[i].part_name : "--"} (${parts[i].part_number ? parts[i].part_number : "--"})
                                            </div>
                                            <div class="livis-discard-recipe-text text-center mt-2">
                                            <span data-i18n="use_case">Use case</span> : ${parts[i].usecase_name ? parts[i].usecase_name : "--"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                `

            }
            setTimeout(() => {
                part_list_wrap.innerHTML = partListHTML
                // i18n()

                setIsLoading(false, 'Please wait until we fetch the parts...')
            }, 500);

        }, (error, msg) => {
            setIsLoading(false, 'Please wait until we fetch the parts...')
            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message)
            }
        })
    } else if (capture_type == 'not-golden') {
        let payload = {
            skip: 0,
            limit: itemsPerPage
        }
        post('/part_capture/get_all_parts_for_workstation', payload, async (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }

            livis_data_capture_type_selection_modal.hide()
            livis_data_capture_part_selection_modal.show()
            localStorage.setItem('workstation_type', result?.data?.workstation_type)
            const workstation_type = result?.data?.workstation_type
            const waypoint_wrap = document.getElementById("waypoints-wrap")
            const start_capture_btn = document.getElementById("start-capture-btn")
            if (workstation_type == 'static') {
                waypoint_wrap.classList.add('invisible')
                start_capture_btn.classList.remove('invisible')
            } else if (workstation_type == 'cobot') {
                waypoint_wrap.classList.remove('invisible')
                start_capture_btn.classList.remove('invisible')
                // start_capture_btn.innerText = await translateIntermediateText('Start Cobot Cycle')
            } else if (workstation_type == 'conveyor') {
                waypoint_wrap.classList.add('invisible')
                start_capture_btn.classList.remove('invisible')
            }

            livis_data_capture_type_selection_modal.hide()
            livis_data_capture_part_selection_modal.show()
            let partListHTML = ``
            const part_list_wrap = document.getElementById("part-list-wrap")
            parts = result?.data?.part_data
            total_parts = result?.data?.total
            for (let i = 0; i < parts.length; i++) {

                partListHTML += `
                                <div class="col-md-4 col-sm-6">
                                    <div class="livis-capture-type-selection-card" id="livis-parts-${i}" onclick="onSelectionPart('${i}')">
                                        <div class=" livis-gallery-images-wrap">
                                            <div class="livis-gallery-images">
                                            <img src="${parts[i].thumbnail ? parts[i].thumbnail : '../common/image/gallery.svg'}" alt="" width="100%" height="100%" style="border-radius : 8px">
                                            </div>
                                        </div>
                                        <div class="livis-capture-type-selection-card-text p-2">
                                            <div class="livis-capture-type-selection-card-text-heading">
                                            ${parts[i].part_name ? parts[i].part_name : "--"} (${parts[i].part_number ? parts[i].part_number : "--"})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                `

            }
            const totalPages = Math.ceil(result?.data?.total / itemsPerPage);
            const hasNextPage = result?.data?.total > itemsPerPage
            const hasPrevPage = false
            let paginationHTML = ``
            paginationHTML = `
                        <div class="pagination" id="pagination-controls">
                            <button data-i18n="prev" class="btn btn-primary operator-panel-primary-btn" onclick="goToPrevPage()" ${hasPrevPage ? '' : 'disabled'}>Prev</button>
                            <span>${currentPage} / ${totalPages}</span>
                            <button data-i18n="next_btn" class="btn btn-primary operator-panel-primary-btn" onclick="goToNextPage()" ${hasNextPage ? '' : 'disabled'}>Next</button>
                        </div>
                `;
            setTimeout(() => {
                part_list_wrap.innerHTML = paginationHTML + partListHTML
                i18n()
                setIsLoading(false, 'Please wait until we fetch the parts...')

            }, 500);


        }, (error, msg) => {
            setIsLoading(false, 'Please wait until we fetch the parts...')
            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message)
            }
        })
    }
}

var total_parts = 0

/**
 * Fetches all parts for the data capture process with pagination, updates the UI accordingly,
 * and handles loading state and error messages.
 * 
 * @param {number} skip - The number of items to skip for pagination.
 * @param {number} limit - The number of items to fetch per page.
 */

const getAllDataCaptureParts = (skip, limit) => {
    setIsLoading(true, "Please wait....")
    let payload = {
        skip, limit
    }
    post('/part_capture/get_all_parts_for_workstation', payload, (result, msg) => {
        let partListHTML = ``
        const part_list_wrap = document.getElementById("part-list-wrap")
        parts = result?.data?.part_data
        total_parts = result?.data?.total
        for (let i = 0; i < parts.length; i++) {

            partListHTML += `
                                <div class="col-md-4 col-sm-6">
                                    <div class="livis-capture-type-selection-card" id="livis-parts-${i}" onclick="onSelectionPart('${i}')">
                                        <div class=" livis-gallery-images-wrap">
                                            <div class="livis-gallery-images">
                                            <img src="${parts[i].thumbnail ? parts[i].thumbnail : '../common/image/gallery.svg'}"  onerror="this.onerror=null; this.src='../common/image/home-inspection-img.svg';" width="100%" height="100%" style="border-radius : 8px">
                                            </div>
                                        </div>
                                        <div class="livis-capture-type-selection-card-text p-2">
                                            <div class="livis-capture-type-selection-card-text-heading">
                                            ${parts[i].part_name ? parts[i].part_name : "--"} (${parts[i].part_number ? parts[i].part_number : "--"})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                `

        }


        const totalPages = Math.ceil(total_parts / itemsPerPage);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;
        const paginationHTML = `
                        <div class="pagination" id="pagination-controls">
                            <button data-i18n="prev" class="btn btn-primary operator-panel-primary-btn" onclick="goToPrevPage()" ${hasPrevPage ? '' : 'disabled'}>Prev</button>
                            <span>${currentPage} / ${totalPages}</span>
                            <button data-i18n="next" class="btn btn-primary operator-panel-primary-btn" onclick="goToNextPage()" ${hasNextPage ? '' : 'disabled'}>Next</button>
                        </div>
            `;
        setTimeout(() => {
            part_list_wrap.innerHTML = paginationHTML + partListHTML
            // i18n()
            setIsLoading(false, "Please wait....")

        }, 500);
    }, (error, msg) => {
    })

}

/**
 * Event handler for the "Next" button in pagination.
 * Increments the current page and fetches the next set of parts.
 */
// Event handler for next button
function goToNextPage() {
    // console.log(total_parts, Math.ceil(total_parts / itemsPerPage))
    if (currentPage < Math.ceil(total_parts / itemsPerPage)) {
        currentPage++;
        skip = skip + itemsPerPage
        getAllDataCaptureParts(skip, itemsPerPage);
    }
}

/**
 * Event handler for the "Prev" button in pagination.
 * Decrements the current page and fetches the previous set of parts.
 */
// Event handler for prev button
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        skip = skip - itemsPerPage
        getAllDataCaptureParts(skip, itemsPerPage);
    }
}


/**
 * Handles the selection of a part from the list.
 * Enables the submit button and highlights the selected part.
 * 
 * @param {number} value - The index of the selected part in the parts array.
 */

const onSelectionPart = (value) => {
    const part_selection_submit = document.getElementById("part-selection-submit")
    part_selection_submit.disabled = false
    const selectedPart = parts[value]
    localStorage.setItem('part', JSON.stringify(selectedPart))
    for (let i = 0; i < parts.length; i++) {
        let part = document.getElementById(`livis-parts-${i}`)
        part.classList.remove('active')
    }

    const selectedPartRef = document.getElementById(`livis-parts-${value}`)
    selectedPartRef.classList.add("active")
}

/**
 * Handles the selection of a use case from the list.
 * Enables the submit button and updates the UI based on the selected use case.
 * 
 * @param {number} value - The index of the selected use case in the usecases array.
 */

const onSelectionUsecase = (value) => {
    const part_selection_submit = document.getElementById("usecase-selection-submit")
    part_selection_submit.disabled = false
    const selectedPart = usecases[value]
    // console.log(selectedPart)
    const workstation_type = localStorage.getItem('workstation_type')
    const start_capture_btn = document.getElementById('start-capture-btn')
    const start_cycle_btn = document.getElementById('start-cycle-btn')
    if (workstation_type == 'conveyor' || workstation_type == 'cobot') {
        // start_cycle_btn.classList.remove('d-none')
        start_capture_btn.disabled = true
    }
    localStorage.setItem('usecase', JSON.stringify(selectedPart))
    for (let i = 0; i < usecases.length; i++) {
        let part = document.getElementById(`livis-usecases-${i}`)
        part.classList.remove('active')
    }

    const selectedPartRef = document.getElementById(`livis-usecases-${value}`)
    selectedPartRef.classList.add("active")
}

/**
 * Navigates back to the data capture type selection modal.
 * Hides the part selection modal.
 */

function goBackToTypeSelection() {
    livis_data_capture_type_selection_modal.show()
    livis_data_capture_part_selection_modal.hide()
}

/**
 * Completes the part selection process and prepares the UI for the next steps
 * based on the selected part and its workstation type.
 */

async function donePartSelection() {

    const capture_type = localStorage.getItem("capture_type")
    if (capture_type == 'golden') {
        setIsLoading(true, 'Please wait until till the setup is ready...')
        const seletedPart = JSON.parse(localStorage.getItem('part'))
        // const id = seletedPart._id['$oid']


        // const live_cycle_block = document.getElementById("live-cycle-block")
        // live_cycle_block.classList.remove("d-flex")
        // live_cycle_block.classList.add("d-none")
        const waypoints_wrap = document.getElementById("waypoints-wrap")
        waypoints_wrap.classList.add("d-flex")
        waypoints_wrap.classList.remove("d-none")
        const classifier = document.getElementById("classifier")
        classifier.classList.remove('d-flex')
        classifier.classList.add('d-none')
        // get('/part_capture/golden_image_edge_connect/' + id, (result, msg) => {
        // if (msg) {
        //     showToast("success", msg)
        // } else {
        //     //showToast("success", 'Operation Successfull')
        // }
        const workstation_type = JSON.parse(localStorage.getItem("part"))?.workstation_type
        localStorage.setItem("workstation_type", workstation_type)
        const waypoint_wrap = document.getElementById("waypoints-wrap")
        const start_capture_btn = document.getElementById("start-capture-btn")
        if (workstation_type == 'static') {
            // waypoint_wrap.classList.add('invisible')
            start_capture_btn.classList.remove('invisible')
        } else if (workstation_type == 'cobot' && false) {
            // waypoint_wrap.classList.remove('invisible')
            start_capture_btn.classList.remove('invisible')
            start_capture_btn.innerText = 'Record Waypoint'
        } else if (workstation_type == 'conveyor' || workstation_type == 'cobot') {
            // waypoint_wrap.classList.add('invisible')
            start_capture_btn.classList.remove('invisible')
        }

        const upload_btn = document.getElementById("upload-btn")
        const download_btn = document.getElementById("download-btn")
        upload_btn.classList.add("d-none")
        download_btn.classList.add("d-none")


        const part_data = seletedPart
        const part_name = document.getElementById("part-name")
        const part_number = document.getElementById("part-number")
        part_name.innerText = part_data?.part_name
        part_number.innerText = part_data?.part_number

        // let cameraFeedHTL = ``
        // for (let i = 0; i < part_data?.workstation_cameras?.length; i++) {
        //     cameraFeedHTL += `
        //                 <div class="livis-operator-builder-feed livis-operator-builder-feed-${part_data?.workstation_cameras?.length}">
        //                     <img src="../common/image/camera-icon.svg" id="camera-feed-${i}" alt="">
        //                 </div>
        //         `
        // }
        // camera_feeds_wrap.innerHTML = cameraFeedHTL
        // // // i18n()
        const image_preview_wrapper = document.getElementById("image-preview-wrapper")
        if (part_data) {
            localStorage.setItem('part', JSON.stringify(part_data))
            livis_data_capture_part_selection_modal.hide()
        }

        const camera_feeds_wrap = document.getElementById("camera-feeds-wrap")
        updateCameraFeeds(part_data?.workstation_cameras?.length);
        let previewHTML = ``
        image_preview_wrapper.innerHTML = ''
        for (let i = 0; i < part_data?.workstation_cameras?.length; i++) {
            previewHTML += `
                        <div class="image-priview">
                            <img src="../common/image/camera-icon.svg" alt="">
                        </div>
                    `
        }
        ////console.log(previewHTML)
        image_preview_wrapper.innerHTML = previewHTML
        // Add next and previous buttons
        if (part_data?.workstation_cameras?.length > camerasPerPage) {
            camera_feeds_wrap.insertAdjacentHTML('afterend', `
             <div class="pagination">
                 <button class="btn btn-primary operator-panel-primary-btn" id="prev-button" onclick="prevPage(${part_data?.workstation_cameras?.length})">Previous</button>
                 <button class="btn btn-primary operator-panel-primary-btn" id="next-button" onclick="nextPage(${part_data?.workstation_cameras?.length})">Next</button>
             </div>
         `);
        }





        //check for worstation type
        // const workstation_type = localStorage.getItem('workstation_type')
        // if (workstation_type == 'cobot') {
        //     const last_waypoint = parseInt(result?.data?.last_waypoint.substring(1), 10);
        //     const waypointsWrap = document.getElementById("waypoints-wrap");
        //     while (waypointsWrap.firstChild) {
        //         waypointsWrap.removeChild(waypointsWrap.firstChild);
        //     }
        //     if (last_waypoint == 0) {
        //         const newDiv = document.createElement("div");
        //         newDiv.className = `livis-capture-position-wrap active`;
        //         newDiv.textContent = `P0`;
        //         waypointsWrap.appendChild(newDiv);
        //     } else {
        //         for (let i = 0; i <= last_waypoint; i++) {
        //             let newDiv = document.createElement("div");
        //             newDiv.className = `livis-capture-position-wrap ${((i) == last_waypoint) ? 'active' : ''}`;
        //             newDiv.textContent = `P${i}`;  // You can customize the content here
        //             waypointsWrap.appendChild(newDiv);

        //         }
        //     }


        // }

        setIsLoading(false, 'Please wait until till the setup is ready...')

        // }, (error, msg) => {
        //     setIsLoading(false, 'Please wait until till the setup is ready...')
        //     if (msg) {
        //         //window.livisapi.livisShowNotification(msg);
        //         showToast('danger', msg)
        //     } else {
        //         //window.livisapi.livisShowNotification(error.message);
        //         showToast('danger', error.message)
        //     }
        // })

    } else {
        setIsLoading(true, 'Please wait until we fetch all the usecases...');

        const seletedPart = JSON.parse(localStorage.getItem('part'));
        const part_number = seletedPart.part_number;
        const user_info = JSON.parse(localStorage.getItem('livis_user_info'));
        const workstation_id = user_info.inspection_station_id;

        post('/part_capture/get_usecases_for_given_part_number/', { part_number, workstation_id }, (result, msg) => {
            if (msg) {
                showToast("success", msg);
            } else {
                // showToast("success", 'Operation Successfull');
            }

            // const part_data = result?.data?.part_data[0];
            // const camera_feeds_wrap = document.getElementById("camera-feeds-wrap");
            // captureCameras = part_data?.workstation_cameras || [];


            // // Initial setup
            // updateCameraFeeds(captureCameras.length);

            // // Add next and previous buttons
            // if (captureCameras.length > camerasPerPage) {
            //     camera_feeds_wrap.insertAdjacentHTML('afterend', `
            //     <div class="pagination">
            //         <button class="btn btn-primary operator-panel-primary-btn" id="prev-button" onclick="prevPage(${captureCameras.length})">Previous</button>
            //         <button class="btn btn-primary operator-panel-primary-btn" id="next-button" onclick="nextPage(${captureCameras.length})">Next</button>
            //     </div>
            // `);
            // }

            livis_data_capture_part_selection_modal.hide();
            livis_data_capture_usecase_selection_modal.show();

            let partListHTML = '';
            const part_list_wrap = document.getElementById("usecase-list-wrap");
            usecases = result?.data?.part_data;

            for (let i = 0; i < usecases.length; i++) {
                partListHTML += `
                <div class="col-md-4">
                    <div class="livis-capture-type-selection-card" id="livis-usecases-${i}" onclick="onSelectionUsecase('${i}')">
                        <div class="livis-gallery-images-wrap">
                            <div class="livis-gallery-images">
                            <img src="${usecases[i].usecase_thumbnail ? usecases[i].usecase_thumbnail : '../common/image/gallery.svg'}" alt="" width="100%" height="100%" style="border-radius : 8px">
                            </div>
                        </div>
                        <div class="livis-capture-type-selection-card-text p-2">
                            <div class="livis-capture-type-selection-card-text-heading">
                                ${usecases[i].usecase_name ? usecases[i].usecase_name : "--"}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }

            setTimeout(() => {
                part_list_wrap.innerHTML = partListHTML;
                // // i18n()
                setIsLoading(false, 'Please wait until we fetch all the use cases...');
            }, 500);

        }, (error, msg) => {
            setIsLoading(false, 'Please wait until we fetch all the use cases...');

            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg);
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message);
            }
        });
    }
}

/**
 * Updates the camera feeds displayed on the page based on the current camera page and the total number of cameras.
 * 
 * @param {number} length - The total number of cameras available.
 */

function updateCameraFeeds(length) {
    const camera_feeds_wrap = document.getElementById("camera-feeds-wrap");
    const startIdx = currentCameraPage * camerasPerPage;
    const endIdx = (currentCameraPage + 1) * camerasPerPage;
    let cameraFeedHTL = '';
    console.log(captureCameras);
    for (let i = startIdx; i < Math.min(endIdx, length); i++) {
        src = "../common/image/camera-icon.svg"
        if (captureCameras[i]) {
            src = captureCameras[i][captureCameras[i].length - 1]
        }
        console.log('feed', src);
        if (src) {
            cameraFeedHTL += `
        <div class="livis-operator-builder-feed livis-operator-builder-feed-${Math.min(camerasPerPage, length) === 3 ? 4 : Math.min(camerasPerPage, length)}">
            <img src="${src}" id="camera-feed-C${i + 1}" alt="">
        </div>`;
        } else {
            src = "../common/image/camera-icon.svg"
            cameraFeedHTL += `
        <div class=" livis-operator-builder-feed-${Math.min(camerasPerPage, length) === 3 ? 4 : Math.min(camerasPerPage, length)}">
            <div class="operator-panel-feed p-0 position-relative camera-not-available">
                                        <img class="no-camera-img" src="../common/image/no_preview_camera.svg"/>
                                        </br></br>
                                        <p>Camera Not Available</p>
                                        <p>Your camera view will be displayed here once connected</p>
                                        </div>
        </div>`;
        }

    }

    camera_feeds_wrap.innerHTML = cameraFeedHTL;
    // i18n()
    // console.log(cameraFeedHTL)
}

/**
 * Moves to the next page of camera feeds and updates the display.
 * 
 * @param {number} length - The total number of cameras available.
 */

function nextPage(length) {
    // console.log(captureCameras, length, currentCameraPage)
    if (currentCameraPage < Math.ceil(length / camerasPerPage) - 1) {
        currentCameraPage++;
        updateCameraFeeds(length);
    }
}

/**
 * Moves to the previous page of camera feeds and updates the display.
 * 
 * @param {number} length - The total number of cameras available.
 */

function prevPage(length) {
    if (currentCameraPage > 0) {
        currentCameraPage--;
        updateCameraFeeds(length);
    }
}

/**
 * Navigates back to the part selection modal.
 */

function goBackToPartSelection() {
    livis_data_capture_part_selection_modal.show()
    livis_data_capture_usecase_selection_modal.hide()
}

/**
 * Completes the use case selection process, sets up the UI, and handles the display of camera feeds and image previews.
 */

function doneUsecaseSelection() {
    setIsLoading(true, 'Please wait until till the setup is ready...')

    const usecase = JSON.parse(localStorage.getItem("usecase"))
    ////console.log(usecase)
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const part_number = seletedPart.part_number
    const user_info = JSON.parse(localStorage.getItem('livis_user_info'))
    const workstation_id = user_info.inspection_station_id
    const workstation_type = localStorage.getItem('workstation_type')
    let payload = {
        workstation_id: workstation_id,
        part_number: part_number,
        usecase: usecase,
        usecase_id: usecase._id
    }
    post('/get_part_doc_for_data_capture', payload, async (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
        ////console.log(result.data)
        if (workstation_type != 'static') {
            setTimeout(() => {
                startCapture()
            }, 1500);
        }

        selectedTag("UNSORTED")
        if (result?.data?.cycle) {
            const undo_btn = document.getElementById("undo-btn")
            undo_btn.disabled = false
            undo_btn.classList.remove("invisible")
        }
        if (workstation_type == 'conveyor' || workstation_type == 'cobot') {
            const plc_configure = document.getElementById('plc-configure')
            plc_configure.classList.remove('d-none')
        }



        const cycle_wrap = document.getElementById("cycle-wrap")
        cycle_wrap.classList.remove('invisible')
        const translatedCycle = await translateIntermediateText('Cycle');
        cycle_wrap.innerText = `${translatedCycle}: ${result?.data?.cycle} `
        const live_cycle_block = document.getElementById("live-cycle-block")
        // live_cycle_block.classList.remove("col-md-2")
        // live_cycle_block.classList.add("col-md-2")
        const waypoints_wrap = document.getElementById("waypoints-wrap")
        waypoints_wrap.classList.remove("col-md-7")
        // waypoints_wrap.classList.add("col-md-6")
        const preview_block = document.getElementById("image-preview-block")
        preview_block.classList.remove("invisible")
        const image_preview_wrapper = document.getElementById("image-preview-wrapper")
        const total_images_captured = document.getElementById("no-of-images-wrap")
        total_images_captured.classList.remove("invisible")
        const translatedImageCount = await translateIntermediateText('Image Count');
        total_images_captured.innerText = `${translatedImageCount}: ${result?.data?.number_of_images} `

        livis_data_capture_usecase_selection_modal.hide()
        const part_data = result?.data?.part_data
        const part_name = document.getElementById("part-name")
        const part_number = document.getElementById("part-number")
        part_name.innerText = part_data?.part_name
        part_number.innerText = part_data?.part_number
        localStorage.setItem('workstation_data', JSON.stringify(result?.data?.workstation_data?.data))
        localStorage.setItem('part', JSON.stringify(result?.data?.part_data))
        const workstation_data = result?.data?.workstation_data?.data
        const camera_feeds_wrap = document.getElementById("camera-feeds-wrap")
        captureCameras = []
        // Initial setup
        updateCameraFeeds(workstation_data?.camera?.length);
        let previewHTML = ``
        image_preview_wrapper.innerHTML = ''
        // i18n()
        for (let i = 0; i < workstation_data?.camera?.length; i++) {
            previewHTML += `
                        <div class="image-priview">
                            <img src="../common/image/camera-icon.svg" alt="">
                        </div>
                    `
        }
        ////console.log(previewHTML)
        image_preview_wrapper.innerHTML = previewHTML
        // Add next and previous buttons
        if (workstation_data?.camera?.length > camerasPerPage && !isPaginationInitialized) {
            camera_feeds_wrap.insertAdjacentHTML('afterend', `
             <div class="pagination">
                 <button class="btn btn-primary operator-panel-primary-btn" id="prev-button" onclick="prevPage(${workstation_data?.camera?.length})">Previous</button>
                 <button class="btn btn-primary operator-panel-primary-btn" id="next-button" onclick="nextPage(${workstation_data?.camera?.length})">Next</button>
             </div>
         `);
            isPaginationInitialized = true
        }

        const upload_btn = document.getElementById("upload-btn")
        const download_btn = document.getElementById("download-btn")
        if (result?.data?.cycle == 0) {
            upload_btn.classList.add("d-none")
            download_btn.classList.add("d-none")
        } else {
            upload_btn.classList.remove("d-none")
            download_btn.classList.remove("d-none")
        }

        setIsLoading(false, 'Please wait until till the setup is ready...')
    }, (error, msg) => {
        setIsLoading(false, 'Please wait until till the setup is ready...')
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            // showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            // showToast('danger', error.message)
        }
    })
}




const livis_gallery_modal = new bootstrap.Modal(document.getElementById("livis-gallery-modal"))
const livis_gallery_modal_ref = document.getElementById("livis-gallery-modal-ref")
const livis_gallery_modal_content_ref = document.getElementById("livis-gallery-modal-content-ref")
var fullSize = false

var gallery_images
var gallery_position_length = 0
var gallery_total_images = 0
var galleryImageType = 'UNSORTED'
let galleryItemsPerPage = 8

/**
 * Opens the image gallery modal and loads images based on the selected part and workstation type.
 */
function openImageGallery() {
    currentPage = 1
    let payload = {
        "limit": galleryItemsPerPage,
        "current_page": 1
    }
    livis_gallery_modal.show()
    setIsLoading(true, 'Please wait until we load all the Images...')
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const workstation_type = localStorage.getItem('workstation_type')
    const id = seletedPart._id
    post('/part_capture/preview_data_capture', { workstation_type: workstation_type, part_id: id, bucket_type: galleryImageType, ...payload }, (result, msg) => {

        if (workstation_type == 'cobots') {
            ////console.log(result?.data?.data_preview_image)
            ////console.log(Object.values(result?.data?.data_preview_image))
            gallery_images = result?.data?.data_preview_image
            gallery_position_length = Object.keys(result?.data?.data_preview_image).length

            positionUpdateonTypeSelect()


            const unsorted_p0 = gallery_images['P0']
            ////console.log(unsorted_p0)
            const livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
            var unsorted_p0_HTML = ``
            for (let i = 0; i < unsorted_p0.length; i++) {
                if (unsorted_p0[i].tag_status == 'UNSORTED') {
                    unsorted_p0_HTML += `
                                    <div class="col-md-3 livis-gallery-images-wrap">
                                        <div class="livis-gallery-images">
                                            <img src="${unsorted_p0[i].image_url}" alt="" class="w-100 h-100">
                                            <input type="checkbox" class="form-check-input image-gallery-checkbox" onclick="selectedImageforTypeChange(event, '${unsorted_p0[i].image_file}')" />
                                        </div>
                                    </div>
                   `
                }

            }
            livis_gallery_unsorted_list.innerHTML = unsorted_p0_HTML;
            // i18n()
        } else if (workstation_type == 'static' || workstation_type == 'conveyor' || workstation_type == 'cobot') {
            gallery_images = result?.data?.data_preview_image
            gallery_position_length = result?.data?.data_preview_image?.length
            gallery_total_images = result?.data?.total
            let livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
            if (galleryImageType == 'UNSORTED') {
                livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
            } else if (galleryImageType == 'OK') {
                livis_gallery_unsorted_list = document.getElementById("livis-gallery-ok-list")
            } else if (galleryImageType == 'NG') {
                livis_gallery_unsorted_list = document.getElementById("livis-gallery-ng-list")
            }
            var unsorted_p0_HTML = ``
            if (gallery_position_length) {
                for (let i = 0; i < gallery_position_length; i++) {
                    if (gallery_images[i].tag_status == galleryImageType) {
                        unsorted_p0_HTML += `
                                        <div class="col-md-3 livis-gallery-images-wrap">
                                            <div class="livis-gallery-images">
                                                <img src="${gallery_images[i].image_url}" alt="" class="w-100 h-100">
                                                <input type="checkbox" class="form-check-input image-gallery-checkbox" onclick="selectedImageforTypeChange(event, '${gallery_images[i].image_file}')" />
                                            </div>
                                        </div>
                       `
                    }

                }
            } else {
                unsorted_p0_HTML += `
                <div class="col-md-12 livis-gallery-images-wrap text-center d-flex justify-content-center align-items-center" style="min-height : 25vh">
                        No Images captured yet for ${galleryImageType} bucket
                </div>
`
            }

            console.log(unsorted_p0_HTML)
            const totalPages = Math.ceil(result?.data?.total / galleryItemsPerPage);
            const hasNextPage = result?.data?.total > galleryItemsPerPage
            const hasPrevPage = false
            let paginationHTML = ``
            if (result?.data?.total) {
                paginationHTML = `
                        <div class="pagination" id="pagination-controls">
                            <button data-i18n="prev" class="btn btn-primary operator-panel-primary-btn" onclick="gotTOPrevGalleryImages()" ${hasPrevPage ? '' : 'disabled'}>Prev</button>
                            <span>Page ${currentPage} of ${totalPages} (${result?.data?.total} Images)</span>
                            <button data-i18n="next" class="btn btn-primary operator-panel-primary-btn" onclick="gotTONextGalleryImages()" ${hasNextPage ? '' : 'disabled'}>Next</button>
                        </div>
                `;
            }


            livis_gallery_unsorted_list.innerHTML = unsorted_p0_HTML + paginationHTML;
            // i18n()
            setIsLoading(false, 'Please wait until we load all the Images...')

        }




    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            // showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            // showToast('danger', error.message)
        }
    })


}

/**
 * Fetches and displays gallery images for the specified page and limit, based on the selected part and image type.
 * 
 * @param {number} current_page - The current page number.
 * @param {number} limit - The number of images per page.
 */

const getGalleryImages = (current_page, limit) => {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const workstation_type = localStorage.getItem('workstation_type')
    const id = seletedPart._id
    payload = {
        current_page, limit,
        workstation_type: workstation_type, part_id: id, bucket_type: galleryImageType
    }
    setIsLoading(true, "Please wait....")
    let livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
    if (galleryImageType == 'UNSORTED') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
    } else if (galleryImageType == 'OK') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-ok-list")
    } else if (galleryImageType == 'NG') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-ng-list")
    }
    post('/part_capture/preview_data_capture', payload, (result, msg) => {

        gallery_images = result?.data?.data_preview_image
        gallery_position_length = result?.data?.data_preview_image?.length
        var unsorted_p0_HTML = ``
        for (let i = 0; i < gallery_position_length; i++) {
            unsorted_p0_HTML += `
                                <div class="col-md-3 livis-gallery-images-wrap">
                                    <div class="livis-gallery-images">
                                        <img src="${gallery_images[i]?.image_url}" alt="" class="w-100 h-100">
                                        <input type="checkbox" class="form-check-input image-gallery-checkbox" onclick="selectedImageforTypeChange(event, '${gallery_images[i]?.image_file}')" />
                                    </div>
                                </div>
               `
        }

        const totalPages = Math.ceil(result?.data?.total / galleryItemsPerPage);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;
        let paginationHTML = ``
        paginationHTML = `
                        <div class="pagination" id="pagination-controls">
                            <button data-i18n="prev" class="btn btn-primary operator-panel-primary-btn" onclick="gotTOPrevGalleryImages()" ${hasPrevPage ? '' : 'disabled'}>Prev</button>
                            <span>Page ${currentPage} of ${totalPages} (${result?.data?.total} Images)</span>
                            <button data-i18n="next" class="btn btn-primary operator-panel-primary-btn" onclick="gotTONextGalleryImages()" ${hasNextPage ? '' : 'disabled'}>Next</button>
                        </div>
                `;


        livis_gallery_unsorted_list.innerHTML = unsorted_p0_HTML + paginationHTML;
        // i18n()
        setIsLoading(false, 'Please wait until we load all the Images...')
    }, (error, msg) => {
    })

}


// Event handler for next button
/**
 * Event handler for moving to the next page of gallery images.
 */
function gotTONextGalleryImages() {
    if (currentPage < Math.ceil(gallery_total_images / galleryItemsPerPage)) {
        currentPage++;
        getGalleryImages(currentPage, galleryItemsPerPage);
    }
}

// Event handler for prev button
/**
 * Event handler for moving to the previous page of gallery images.
 */
function gotTOPrevGalleryImages() {
    if (currentPage > 1) {
        currentPage--;
        getGalleryImages(currentPage, galleryItemsPerPage);
    }
}



var typeChangerArray = []
/**
 * Handles image selection based on checkbox state.
 * Adds or removes imageFile from typeChangerArray.
 * Updates visibility of the "move" button based on typeChangerArray length.
 */
function selectedImageforTypeChange(event, imageFile) {
    const checkbox = event.target;

    if (checkbox.checked) {
        typeChangerArray.push(imageFile)
    } else {
        const index = typeChangerArray.indexOf(imageFile);
        if (index !== -1) {
            typeChangerArray.splice(index, 1);
        }
    }
    ////console.log(typeChangerArray)

    const gallery_move_btn_wrap = document.getElementById("gallery-move-btn-wrap")
    if (typeChangerArray.length > 0) {
        gallery_move_btn_wrap.classList.remove('d-none')
    } else {
        gallery_move_btn_wrap.classList.add('d-none')

    }

}

/**
 * Updates the gallery position buttons based on the selected type.
 * Displays buttons for each position and sets the active class on the first position.
 */

function positionUpdateonTypeSelect() {
    const gallery_position_wrap = document.getElementById("gallery-position-wrap")
    gallery_position_wrap.classList.remove('invisible')
    let galleryPositionsHTML = ``

    for (let i = 0; i < gallery_position_length; i++) {
        galleryPositionsHTML += `
                        <div class="livis-gallery-position ${i == 0 && 'active'} " id="gallery-position-${i}" onclick="toggledTag('${galleryImageType}','${i}')" >
                            <span data-i18n="p">P</span>${i}
                        </div>
        `
    }
    gallery_position_wrap.innerHTML = galleryPositionsHTML;
    // i18n()
}

/**
 * Toggles the displayed images based on the selected type and position.
 * Updates the gallery view according to the selected tag status and position.
 */

function toggledTag(type, value) {
    const workstation_type = localStorage.getItem('workstation_type')
    let livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
    if (type == 'UNSORTED') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
    } else if (type == 'OK') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-ok-list")
    } else if (type == 'NG') {
        livis_gallery_unsorted_list = document.getElementById("livis-gallery-ng-list")
    }
    if (workstation_type == 'cobot') {
        for (let i = 0; i < gallery_position_length; i++) {
            const clicked_position = document.getElementById(`gallery-position-${i}`)
            clicked_position.classList.remove('active')
        }
        const clicked_position = document.getElementById(`gallery-position-${value}`)
        clicked_position.classList.add('active')
        ////console.log(type, value)
        const unsorted_p0 = gallery_images[`P${value}`]
        ////console.log(unsorted_p0)
        var unsorted_p0_HTML = ``
        livis_gallery_unsorted_list.innerHTML = '';
        // i18n()
        for (let i = 0; i < unsorted_p0.length; i++) {
            if (unsorted_p0[i].tag_status == type) {
                unsorted_p0_HTML += `
                                    <div class="col-md-3 livis-gallery-images-wrap">
                                        <div class="livis-gallery-images">
                                            <img src="${unsorted_p0[i].image_url}" alt="" class="w-100 h-100">
                                            <input type="checkbox" class="form-check-input image-gallery-checkbox" onclick="selectedImageforTypeChange(event, '${unsorted_p0[i].image_file}')" />
                                        </div>
                                    </div>
                   `
            }

        }
        ////console.log(unsorted_p0_HTML, livis_gallery_unsorted_list)
        livis_gallery_unsorted_list.innerHTML = unsorted_p0_HTML;
        // i18n()
    } else if (workstation_type == 'static' || workstation_type == 'conveyor') {
        var unsorted_p0_HTML = ``
        ////console.log("$$$$$$$$$$$$", type, gallery_position_length, gallery_images)
        for (let i = 0; i < gallery_position_length; i++) {
            if (gallery_images[i].tag_status == type) {
                unsorted_p0_HTML += `
                                <div class="col-md-3 livis-gallery-images-wrap">
                                    <div class="livis-gallery-images">
                                        <img src="${gallery_images[i].image_url}" alt="" class="w-100 h-100">
                                        <input type="checkbox" class="form-check-input image-gallery-checkbox" onclick="selectedImageforTypeChange(event, '${gallery_images[i].image_file}')" />
                                    </div>
                                </div>
               `
            }

        }
        ////console.log(unsorted_p0_HTML, livis_gallery_unsorted_list)
        livis_gallery_unsorted_list.innerHTML = unsorted_p0_HTML;
        // i18n()
    }
}

/**
 * Toggles the health check type buttons and their associated content.
 * Updates button states and visibility based on the selected type.
 */

function toggleHealthCheckType(type) {
    const workstation_type = localStorage.getItem('workstation_type')
    if (workstation_type == 'cobots') {
        for (let i = 0; i < gallery_position_length; i++) {
            const clicked_position = document.getElementById(`gallery-position-${i}`)
            clicked_position.classList.remove('active')
        }

        const clicked_position = document.getElementById(`gallery-position-0`)
        clicked_position.classList.add('active')
    }


    const livis_gallery_unsorted_btn = document.getElementById("livis-gallery-unsorted-btn")
    const livis_gallery_ok_btn = document.getElementById("livis-gallery-ok-btn")
    const livis_gallery_ng_btn = document.getElementById("livis-gallery-ng-btn")
    const livis_gallery_unsorted_list = document.getElementById("livis-gallery-unsorted-list")
    const livis_gallery_ok_list = document.getElementById("livis-gallery-ok-list")
    const livis_gallery_ng_list = document.getElementById("livis-gallery-ng-list")

    const gallery_move_unsorted_btn = document.getElementById("gallery-move-unsorted-btn")
    const gallery_move_ok_btn = document.getElementById("gallery-move-ok-btn")
    const gallery_move_ng_btn = document.getElementById("gallery-move-ng-btn")


    if (type == 'UNSORTED') {
        livis_gallery_unsorted_btn.classList.add("active-health-check-btn")
        livis_gallery_ok_btn.classList.remove("active-health-check-btn")
        livis_gallery_ng_btn.classList.remove("active-health-check-btn")

        livis_gallery_unsorted_list.classList.remove("d-none")
        livis_gallery_ok_list.classList.add("d-none")
        livis_gallery_ng_list.classList.add("d-none")

        gallery_move_unsorted_btn.classList.add("d-none")
        gallery_move_ok_btn.classList.remove('d-none')
        gallery_move_ng_btn.classList.remove('d-none')

        toggledTag('UNSORTED', 0)
        galleryImageType = 'UNSORTED'
        openImageGallery()
    } else if (type == 'OK') {
        livis_gallery_unsorted_btn.classList.remove("active-health-check-btn")
        livis_gallery_ok_btn.classList.add("active-health-check-btn")
        livis_gallery_ng_btn.classList.remove("active-health-check-btn")

        livis_gallery_unsorted_list.classList.add("d-none")
        livis_gallery_ok_list.classList.remove("d-none")
        livis_gallery_ng_list.classList.add("d-none")

        gallery_move_unsorted_btn.classList.remove("d-none")
        gallery_move_ok_btn.classList.add('d-none')
        gallery_move_ng_btn.classList.remove('d-none')

        toggledTag('OK', 0)
        galleryImageType = 'OK'
        openImageGallery()
    } else if (type == 'NG') {
        livis_gallery_unsorted_btn.classList.remove("active-health-check-btn")
        livis_gallery_ok_btn.classList.remove("active-health-check-btn")
        livis_gallery_ng_btn.classList.add("active-health-check-btn")

        livis_gallery_unsorted_list.classList.add("d-none")
        livis_gallery_ok_list.classList.add("d-none")
        livis_gallery_ng_list.classList.remove("d-none")

        gallery_move_unsorted_btn.classList.remove("d-none")
        gallery_move_ok_btn.classList.remove('d-none')
        gallery_move_ng_btn.classList.add('d-none')

        toggledTag('NG', 0)
        galleryImageType = 'NG'
        openImageGallery()
    }
    if (workstation_type == 'cobots') {
        positionUpdateonTypeSelect()
    }
}

/**
 * Sends a request to move selected images to a specified type.
 * Updates the server with the new tag status and handles the response.
 */

function moveTo(type) {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const workstation_type = localStorage.getItem('workstation_type')
    const id = seletedPart._id
    let payload = {
        "workstation_type": workstation_type,
        "part_id": id,
        "tag_status": type,
        "image_file_list": typeChangerArray
    }

    post('/part_capture/tag_update', payload, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }

        typeChangerArray = []
        toggleHealthCheckType('UNSORTED')
        openImageGallery()
        const gallery_move_btn_wrap = document.getElementById("gallery-move-btn-wrap")
        gallery_move_btn_wrap.classList.add('d-none')

    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            // showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            // showToast('danger', error.message)
        }
    })
}

/**
 * Closes the image gallery modal.
 */

function closeImageGallery() {
    livis_gallery_modal.hide()
}

/**
 * Toggles the size of the image gallery modal between full size and default size.
 */

function fullSizeGalleryModal() {
    fullSize = !fullSize
    //////console.log(fullSize)
    if (fullSize) {
        livis_gallery_modal_ref.style.minWidth = '100vw'
        livis_gallery_modal_ref.style.minHeight = '100vh'
        livis_gallery_modal_ref.style.margin = '0px'
        livis_gallery_modal_content_ref.style.minHeight = '100vh'
    } else {
        livis_gallery_modal_ref.style.minWidth = '80%'
        livis_gallery_modal_ref.style.maxWidth = '80%'
        livis_gallery_modal_ref.style.minHeight = 'calc(100% - 3.5rem)'
        livis_gallery_modal_ref.style.maxHeight = 'calc(100% - 3.5rem)'
        livis_gallery_modal_ref.style.margin = '1.75rem auto'
        livis_gallery_modal_content_ref.style.minHeight = '100%'
        livis_gallery_modal_content_ref.style.maxHeight = '100%'
    }
}

/**
 * Stops the capture cycle and updates button states accordingly.
 * Disables and hides certain buttons while showing others.
 */
async function stopCaptureCycle() {
    const stop_cycle_btn = document.getElementById('stop-cycle-btn')
    const start_cycle_btn = document.getElementById('start-cycle-btn')
    const start_capture_btn = document.getElementById('start-capture-btn')
    const upload_btn_btn = document.getElementById('upload-btn-btn')
    const download_btn_btn = document.getElementById('download-btn-btn')
    get("/stop_capture_poll", async (result, msg) => {
        stop_cycle_btn.classList.add('d-none')
        // start_cycle_btn.classList.remove('d-none')
        start_capture_btn.disabled = true
        start_capture_btn.innerText = await translateIntermediateText('Capture')
        upload_btn_btn.disabled = false
        download_btn_btn.disabled = false
        // showCaptureResult(result.data.data_capture_image)
        eventSource?.close()
    }, (err, msg) => {
        // console.log(err)
        // alert("yes")
        const undo_btn = document.getElementById("undo-btn")
        undo_btn.disabled = true
        undo_btn.classList.add("invisible")
    })
}






//operations for the waypoint type selection
const add_waypoint_inspection_radio_btn = document.getElementById("radio-1")
const add_waypoint_waypoint_radio_btn = document.getElementById("radio-2")



// add_waypoint_inspection_radio_btn.addEventListener('click', () => {
//     if (add_waypoint_inspection_radio_btn.checked) {
//         //////console.log('Option 1 is checked');
//         add_waypoint_waypoint_radio_btn.checked = false;
//     }
// });

// add_waypoint_waypoint_radio_btn.addEventListener('click', () => {
//     if (add_waypoint_waypoint_radio_btn.checked) {
//         //////console.log('Option 2 is checked');
//         add_waypoint_inspection_radio_btn.checked = false;
//     }
// });


/**
 * Updates the active tag based on the selected value.
 * Removes the 'active' class from all tags and adds it to the tag corresponding to the selected value.
 * Sends a request to update the tag status on the server.
 * @param {string} value - The selected tag value ('UNSORTED', 'OK', or 'NG').
 */

function selectedTag(value) {
    for (let i = 0; i < 3; i++) {
        const tag = document.getElementById(`tag-${i}`)
        tag.classList.remove('active')
    }
    if (value == 'UNSORTED') {
        const tag = document.getElementById(`tag-0`)
        tag.classList.add('active')
    } else if (value == 'OK') {
        const tag = document.getElementById(`tag-1`)
        tag.classList.add('active')
    } else if (value == 'NG') {
        const tag = document.getElementById(`tag-2`)
        tag.classList.add('active')
    }
    post('/part_capture/sort_tag', { tag: value }, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            showToast('danger', error.message)
        }
    })
}

/**
 * Changes the data capture type between 'golden' and 'not-golden'.
 * Updates the UI and local storage based on the selected type.
 * Adjusts button states and visibility for different capture types.
 * @param {string} type - The type of capture ('golden' or 'not-golden').
 */
function changeDataCaptureType(type) {
    const livis_capture_type_golden = document.getElementById("livis-capture-type-golden")
    const livis_capture_type_not_golden = document.getElementById("livis-capture-type-not-golden")
    const golden_icon = document.getElementById("golden-icon")
    const image_gallery_menu = document.getElementById("image-gallery-menu")
    // const live_cycle_block = document.getElementById("live-cycle-block")
    // live_cycle_block.classList.remove("d-none")
    // live_cycle_block.classList.add("d-flex")
    // live_cycle_block.classList.remove("col-md-2")
    // live_cycle_block.classList.add("col-md-5")
    const waypoints_wrap = document.getElementById("waypoints-wrap")
    const cycle_wrap = document.getElementById('cycle-wrap')
    const no_of_image_wrap = document.getElementById('no-of-images-wrap')
    // waypoints_wrap.classList.remove("d-flex")
    const add_waypoint_btn = document.getElementById('add-waypoint-btn')
    // waypoints_wrap.classList.add("d-none")
    const classifier = document.getElementById("classifier")
    const waypointsWrap = document.getElementById('waypoints-wrap')
    classifier.classList.remove("col-md-3")
    classifier.classList.add("col-md-4")

    if (type == 'golden') {
        livis_capture_type_golden.classList.add("active")
        livis_capture_type_not_golden.classList.remove("active")
        localStorage.setItem('capture_type', 'golden')
        classifier.classList.add('invisible')
        golden_icon.classList.remove('invisible')
        image_gallery_menu.classList.add('d-none')
        add_waypoint_btn.classList.remove('d-none')
        waypointsWrap.classList.remove('invisible')
        cycle_wrap.classList.add('d-none')
        no_of_image_wrap.classList.add('d-none')
        const newDiv = document.createElement("div");
        newDiv.className = "livis-capture-position-wrap active";
        newDiv.id = 'P0'
        newDiv.textContent = `P0`;  // You can customize the content here
        current_waypoint = 'P0';
        // Append the new div to the waypoints-wrap div
        waypointsWrap.appendChild(newDiv);
        add_waypoint_btn.disabled = true
        const start_capture_btn = document.getElementById('start-capture-btn')
        start_capture_btn.removeAttribute('onclick')

        start_capture_btn.addEventListener('click', startCapture)

    } else {
        livis_capture_type_golden.classList.remove("active")
        livis_capture_type_not_golden.classList.add("active")
        localStorage.setItem('capture_type', 'not-golden')
        classifier.classList.remove('invisible')
        golden_icon.classList.add('invisible')
        image_gallery_menu.classList.remove('d-none')

    }
}


/**
 * Shows a modal for adding a waypoint and pre-fills it with data.
 * Updates the waypoint title and input fields based on the provided data.
 * @param {Object} data - The waypoint data containing coordinate and transit point information.
 */
async function addWaypoint(data) {
    //console.log(data)
    add_waypoint_modal.show()
    const position_input = document.getElementById("position-number")
    position_input.value = data?.coordinate
    if (data?.transit_point) {
        add_waypoint_waypoint_radio_btn.checked = true
        add_waypoint_inspection_radio_btn.checked = false
    } else {
        add_waypoint_waypoint_radio_btn.checked = false
        add_waypoint_inspection_radio_btn.checked = true

    }
    const waypoint_number_title = document.getElementById("waypoint-number-title")
    current_waypoint = data?.waypoint
    waypoint_number_title.innerText = await translateIntermediateText(`Add ${data?.waypoint} Waypoint`)
}


/**
 * Shows a modal for adding a waypoint with a coordinate.
 * Updates the waypoint title based on the provided coordinate.
 * @param {string} data - The coordinate for the waypoint.
 */
async function addWaypointConveyor(data) {
    console.log(data)
    add_waypoint_modal.show()
    const position_input = document.getElementById("position-number")
    position_input.value = data

    const waypoint_number_title = document.getElementById("waypoint-number-title")
    current_waypoint = data
    waypoint_number_title.innerText = await translateIntermediateText(`Add ${data} Waypoint`)
}

// function deleteWaypoint() {
//     add_waypoint_modal.hide()
//     discard_waypoint_modal.show()
// }


/**
 * Hides the modals for adding and discarding waypoints.
 */
function cancelDeleteWaypoint() {
    add_waypoint_modal.hide()
    discard_waypoint_modal.hide()
}


/**
 * Sends a request to delete a waypoint from the server.
 * Updates the UI and shows a success or error message based on the server response.
 */
function deletedWaypoint() {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const id = seletedPart._id['$oid']
    post('/part_capture/delete_waypoint', { part_id: id }, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
        discard_waypoint_modal.hide()
        donePartSelection()
    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            showToast('danger', error.message)
        }
    })
}



/**
 * Uploads data to the cloud based on the capture type.
 * Handles 'golden' and 'not-golden' capture types differently.
 * Updates the UI and shows success or error messages based on the server response.
 */
function uploadZip() {
    setIsLoading(true, 'Uploading Data to cloud ....')
    const workstation_type = localStorage.getItem('workstation_type')
    const capture_type = localStorage.getItem("capture_type")
    if (capture_type == 'golden') {
        const seletedPart = JSON.parse(localStorage.getItem('part'))
        const id = seletedPart._id['$oid']
        post('/part_capture/golden_image_upload', { part_id: id }, (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }
            did_capture_golden_image = true
            setIsLoading(false, 'Uploading Data to cloud ....')
            endCapture()

            // doneUsecaseSelection()
        }, (error, msg) => {
            setIsLoading(false, 'Uploading Data to cloud ....')

            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                showToast('danger', error.message)
            }
        })
    } else {
        if (eventSource) {
            eventSource.close()
        }
        const seletedPart = JSON.parse(localStorage.getItem('part'))
        const id = seletedPart._id
        post('/part_capture/upload_data_capture', { part_id: id }, (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }
            // endCapture()
            setIsLoading(false, 'Uploading Data to cloud ....')
            doneUsecaseSelection()

        }, (error, msg) => {
            setIsLoading(false, 'Uploading Data to cloud ....')

            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message)
            }
        })
    }
}


/**
 * Downloads data from the cloud based on the capture type.
 * Handles 'golden' and 'not-golden' capture types differently.
 * Updates the UI and shows success or error messages based on the server response.
 */
function downloadZip() {
    setIsLoading(true, 'Downloading Data ...')
    const workstation_type = localStorage.getItem('workstation_type')
    const capture_type = localStorage.getItem("capture_type")
    if (capture_type == 'golden') {
        const seletedPart = JSON.parse(localStorage.getItem('part'))
        const id = seletedPart._id['$oid']
        post('/part_capture/golden_image_upload', { part_id: id }, (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }
            did_capture_golden_image = true
            setIsLoading(false, 'Uploading Data to cloud ....')
            endCapture()

            // doneUsecaseSelection()
        }, (error, msg) => {
            setIsLoading(false, 'Uploading Data to cloud ....')

            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message)
            }
        })
    } else {
        if (eventSource) {
            eventSource.close()
        }
        const seletedPart = JSON.parse(localStorage.getItem('part'))
        const id = seletedPart._id
        post('/part_capture/download_data_capture', { part_id: id, workstation_type: workstation_type }, (result, msg) => {
            if (msg) {
                showToast("success", msg)
            } else {
                //showToast("success", 'Operation Successfull')
            }
            // endCapture()
            setIsLoading(false, 'Uploading Data to cloud ....')
            doneUsecaseSelection()

        }, (error, msg) => {
            setIsLoading(false, 'Uploading Data to cloud ....')

            if (msg) {
                //window.livisapi.livisShowNotification(msg);
                // showToast('danger', msg)
            } else {
                //window.livisapi.livisShowNotification(error.message);
                // showToast('danger', error.message)
            }
        })
    }
}


/**
 * Submits the waypoint data and updates the waypoint list.
 * Creates a new waypoint element and adds it to the UI.
 * Updates the current waypoint and hides the add waypoint modal.
 */
function recordWaypointSubmit() {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const part_id = seletedPart._id['$oid']
    const position_number = document.getElementById("position-number").value;
    transit_point = false
    if (add_waypoint_waypoint_radio_btn.checked) {
        transit_point = true
    } else {
        transit_point = false
    }
    const waypoint = current_waypoint

    let payload = {
        part_id, position_number, transit_point, waypoint
    }
    //////console.log(payload)
    post('/part_capture/transit_point', payload, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
        //////console.log(result.data)
        const current_waypint_number = parseInt(current_waypoint.substring(1), 10);
        new_waypoint_number = current_waypint_number + 1


        const waypointsWrap = document.getElementById("waypoints-wrap");
        const activeChild = waypointsWrap.querySelector(".active");
        if (activeChild) {
            activeChild.classList.remove("active");
        }

        // Create a new div element
        const newDiv = document.createElement("div");
        newDiv.className = "livis-capture-position-wrap active";
        newDiv.textContent = `P${new_waypoint_number}`;  // You can customize the content here

        // Append the new div to the waypoints-wrap div
        waypointsWrap.appendChild(newDiv);



        add_waypoint_modal.hide()
    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            // showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            // showToast('danger', error.message)
        }
    })
}


/**
 * Selects a golden position for capture.
 * Logs the selected position.
 * @param {string} pos - The position to be selected.
 */
function selectGoldenPosition(pos) {
    console.log(pos);
}

/**
 * Deletes the current golden waypoint.
 * Updates the waypoint list and shows a success or error message based on the server response.
 */
function deleteWaypointGolden() {
    // console.log('deleting waypoint', id);
    // const current_waypoint_number = parseInt(current_waypoint.substring(1), 10);

    // const waypointsWrap = document.getElementById("waypoints-wrap");
    // if (document.getElementById(`P${id}`)) {
    //     waypointsWrap.removeChild(document.getElementById(`P${id}`));
    //     const activeChild = waypointsWrap.querySelector(".active");
    //     if (activeChild) {
    //         activeChild.classList.remove("active");
    //     }
    //     current_waypoint = `P${current_waypoint_number - 1}`
    //     document.getElementById(current_waypoint).classList.add('active')
    // }
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const id = seletedPart._id['$oid']
    if (current_waypoint != 'P0') {
        post('/part_capture/delete_golden_image_waypoint', { part_id: id, waypoint: current_waypoint }, (result, msg) => {
            if (msg) {
                // showToast("success", msg)   //show when necessary
            } else {
                //showToast("success", 'Operation Successfull')
            }
            console.log('deleting waypoint', current_waypoint);
            const current_waypoint_number = parseInt(current_waypoint.substring(1), 10);
            if (current_waypoint_number > 0) {
                const waypointsWrap = document.getElementById("waypoints-wrap");
                waypointsWrap.removeChild(document.getElementById(current_waypoint));
                const activeChild = waypointsWrap.querySelector(".active");
                if (activeChild) {
                    activeChild.classList.remove("active");
                }

                current_waypoint = `P${current_waypoint_number - 1}`
                document.getElementById(current_waypoint).classList.add("active");
                showToast('success', 'Position Deleted Sucessfully')
            }

        }, (error, msg) => {
            showToast('danger', 'Please Try Again')
        })
    } else
        showToast('danger', 'Position P0 cannot be deleted')

}


/**
 * Submits the waypoint data for a conveyor type.
 * Updates the waypoint list and UI elements based on the current waypoint number.
 * Adds event listeners for new waypoints and shows the add waypoint modal if applicable.
 */
function recordWaypointConveyorSubmit() {

    // const position_number = document.getElementById("position-number")?.value;
    const start_capture_btn = document.getElementById('start-capture-btn')
    const waypoint = current_waypoint

    const workstation_type = localStorage.getItem('workstation_type')
    console.log(waypoint);
    //////console.log(payload)
    //////console.log(result.data)
    const current_waypoint_number = parseInt(current_waypoint.substring(1), 10);
    new_waypoint_number = current_waypoint_number + 1


    const waypointsWrap = document.getElementById("waypoints-wrap");
    const activeChild = waypointsWrap.querySelector(".active");
    if (activeChild) {
        activeChild.classList.remove("active");
    }
    const newDiv = document.createElement("div");
    newDiv.className = "livis-capture-position-wrap active";
    newDiv.textContent = `P${new_waypoint_number}`;
    newDiv.id = `P${new_waypoint_number}`
    // You can customize the content herenewDiv.id = `P${current_waypoint_number + 1}`;
    // Append the new div to the waypoints-wrap div
    waypointsWrap.appendChild(newDiv);
    add_waypoint_btn.disabled = true;
    start_capture_btn.disabled = false;
    current_waypoint = `P${current_waypoint_number + 1}`;
    const elements = document.querySelectorAll(".livis-capture-position-wrap")
    elements.forEach(element => {
        element.removeEventListener('click', addEventListnerGolden)
    })

    // Add event listener to the parent element using event delegation
    waypointsWrap.addEventListener('click', addEventListnerGolden);

    if (workstation_type == 'cobot')
        add_waypoint_modal.show()


    // document.getElementById(current_waypoint).addEventListener('click', deleteWaypointGolden)

    // add_waypoint_modal.hide()
}

// function captureGoldenImage() {
//     const seletedPart = JSON.parse(localStorage.getItem('part'))
//     const part_id = seletedPart._id['$oid']
//     var golden_capture_payload = {
//         part_id: part_id,
//         is_transit: false,
//         waypoint_id: current_waypoint
//     }
//     console.log(golden_capture_payload);
//     add_waypoint_btn.disabled = false
//     post('/part_capture/recapture_waypoint', golden_capture_payload, (result, msg) => {
//         if (msg) {
//             // showToast("success", msg)   //show when necessary
//         } else {
//             //showToast("success", 'Operation Successfull')
//         }
//         showGoldenCaptureResult(result)
//         showToast('success', `Captured Successfully for Postion ${current_waypoint}`)

//     }, (error, msg) => {
//         showToast('danger', 'Please Try Again')
//     })
// }

/**
 * Handles click events for elements with the class 'livis-capture-position-wrap'.
 * Toggles between selecting a waypoint and deleting the current waypoint based on the clicked element's ID.
 * Invokes the `deleteWaypointGolden` function if the clicked element matches the current waypoint.
 * Otherwise, invokes the `selectGoldenPosition` function.
 * @param {Event} event - The click event object.
 */

function addEventListnerGolden(event) {
    const target = event.target;
    if (target.matches('.livis-capture-position-wrap')) {
        const waypointId = target.id;
        if (waypointId === current_waypoint) {
            deleteWaypointGolden();
        } else {
            selectGoldenPosition(waypointId);
        }
    }

}

/**
 * Submits PLC configuration data to the server.
 * Gathers data from form inputs, constructs a payload, and sends a POST request to save PLC configuration.
 * Displays a success message upon successful submission or an error message if the request fails.
 * @function plcConfigSubmit
 */
function plcConfigSubmit() {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const part_id = seletedPart._id['$oid']
    const plc_register = document.getElementById("plc-register").value;
    const plc_idle = document.getElementById("plc-idle").value;
    const plc_active = document.getElementById("plc-active").value;
    const plc_address = document.getElementById("plc-address").value;
    const plc_controller = document.getElementById("plc-controller").value
    const plc_payload = {
        plc_id: "data capture dummy PLC",
        plc_controller: plc_controller,
        plc_address: plc_address,
        register: plc_register,
        idle_value: plc_idle,
        active_value: plc_active
    }
    console.log(plc_payload, '/get_plc_values_for_data_capture');
    post('/get_plc_values_for_data_capture', plc_payload, (result, msg) => {
        if (msg) {
            // showToast("success", msg)   //show when necessary
        } else {
            //showToast("success", 'Operation Successfull')
        }
        livis_PLC_configur_modal.hide()
        showToast('success', 'PLC Configuration Saved')

    }, (error, msg) => {
        showToast('danger', 'Please Try Again')
    })
}

/**
 * Updates the UI to display the results of a golden capture.
 * Modifies the layout to show image previews and camera feeds based on the server response.
 * Updates the image preview and camera feeds elements with the provided response data.
 * This function processes the server response to populate image previews and camera feeds.
 * @function showGoldenCaptureResult
 * @param {Object} response - The server response containing capture data.
 */
function showGoldenCaptureResult(response) {
    const waypoints_wrap = document.getElementById("waypoints-wrap")
    waypoints_wrap.classList.remove("col-md-7")
    waypoints_wrap.classList.add("col-md-5")


    const preview_block = document.getElementById("image-preview-block")
    preview_block.classList.remove("invisible")
    const image_preview_wrapper = document.getElementById("image-preview-wrapper")
    // if (response?.cycle == 0) {
    //     upload_btn.classList.add("d-none")
    //     download_btn.classList.add("d-none")
    // } else {
    //     upload_btn.classList.remove("d-none")
    //     download_btn.classList.remove("d-none")
    // }

    let previewHTML = ``
    image_preview_wrapper.innerHTML = '';
    // i18n()
    // console.log(Object.keys(response).length); 

    for (let i = 0; i < Object.keys(response).length; i++) {
        ////console.log(response?.data_capture_image)
        ////console.log(Object.keys(response?.data_capture_image))
        // console.log('hi');
        ////console.log(Object.values(response?.data_capture_image))
        // console.log(Object.values(Object.values(response[i])[0])[0]);
        console.log("image"+src)
        previewHTML += `
            <div div class="image-priview" >
                <img src="${src}" alt="" class="w-100 h-100" >
                </div>
        `
    }
    // console.log(previewHTML)
    image_preview_wrapper.innerHTML = previewHTML;
    // i18n()
    console.log(Object.values(response)[Object.values(response).length - 1][current_waypoint]);
    captureCameras = []
    console.log(response, current_waypoint);
    const golden_image = Object.values(response)[Object.values(response).length - 1][current_waypoint]
    // const golden_image = Object.values(Object.values(response)[Object.values(response).length - 1][current_waypoint])
    const camera_feeds_wrap = document.getElementById("camera-feeds-wrap")
    for (let i = 0; i < golden_image.length; i++) {
        console.log(i);
        for (key in response[current_waypoint][i][current_waypoint]) {
            console.log(key);
            captureCameras.push([response[current_waypoint][i][current_waypoint][key][response[current_waypoint][i][current_waypoint][key].length - 1] ? response[current_waypoint][i][current_waypoint][key][response[current_waypoint][i][current_waypoint][key].length - 1] : '../common/image/camera-icon.svg']);

        }
    }
    for (key in golden_image) {
        captureCameras.push([golden_image[key]]);
    }
    updateCameraFeeds(captureCameras.length)
    let cameraFeedHTL = ``
    // for (let i = 0; i < golden_image.length; i++) {
    //     cameraFeedHTL += `
    //         <div  class="livis-operator-builder-feed livis-operator-builder-feed-${golden_image.length}" >
    //             <img src="${golden_image[i]}" id="camera-feed-C${i + 1}" alt="">
    //             </div>
    //     `
    // }
    // camera_feeds_wrap.innerHTML = cameraFeedHTL;
    // i18n()

}


var did_capture_golden_image = false


/**
 * Initiates the capture process based on the workstation type and capture type.
 * Manages different types of capture processes (golden image, waypoint recording, data capture) and updates the UI accordingly.
 * 
 * For 'golden' capture type:
 * - For 'static' workstation: Captures a golden image and updates camera feeds.
 * - For 'cobot': Records a waypoint and updates the UI with waypoint and golden image details.
 * - For 'conveyor' or 'cobot': Handles dynamic capture updates and displays captured images.
 * 
 * For non-'golden' capture types:
 * - For 'cobot': Sets up EventSource for live capture updates and handles dynamic updates.
 * - For 'static': Performs static data capture and updates UI with captured image and cycle information.
 * - For 'conveyor': Sets up EventSource for live capture updates similar to 'cobot'.
 * 
 * @async
 * @function startCapture
 */
async function startCapture() {
    const start_capture_btn = document.getElementById("start-capture-btn")
    // const finish_capture_btn = document.getElementById("finish-golden-capture")
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const workstation_type = localStorage.getItem('workstation_type')
    const capture_type = localStorage.getItem("capture_type")
    console.log(seletedPart, workstation_type)
    const id = seletedPart._id['$oid']
    // start_capture_btn.innerText = await translateIntermediateText('Capturing ...')
    // start_capture_btn.setAttribute('disabled', 'true')
    // finish_capture_btn.classList.add("invisible")
    var golden_image = []
    var data_capture_image = []
    const upload_btn = document.getElementById("upload-btn")
    const upload_btn_btn = document.getElementById("upload-btn-btn")
    const download_btn = document.getElementById("download-btn")
    const download_btn_btn = document.getElementById("download-btn-btn")

    if (capture_type == 'golden') {
        if (workstation_type == 'static') {
            post('/part_capture/capture_golden_image', { part_id: id, is_transit: false, waypoint_id: 'P0' }, async (result, msg) => {
                if (msg) {
                    // showToast("success", msg)   //show when necessary
                } else {
                    //showToast("success", 'Operation Successfull')
                }
                //console.log("---------", result?.data)
                golden_image = result?.data?.golden_image
                start_capture_btn.removeAttribute('disabled')

                upload_btn.classList.remove("d-none")
                // download_btn.classList.remove("d-none")
                upload_btn_btn.disabled = false
                download_btn_btn.disabled = false
                // finish_capture_btn.classList.remove("invisible")
                const feed_length = seletedPart.workstation_cameras.length
                //console.log("---------", result?.data, feed_length, golden_image)

                // for (let i = 0; i < feed_length; i++) {
                //     const camera_feed = document.getElementById(`camera-feed-${i}`)
                //     //////console.log(golden_image[i])
                //     camera_feed.setAttribute('src', golden_image[i])
                //     camera_feed.setAttribute('width', '100%')
                //     camera_feed.setAttribute('height', '100%')
                // }

                updateCameraFeeds(feed_length);
                showGoldenCaptureResult(result?.data?.golden_image)
                // let previewHTML = ``
                // image_preview_wrapper.innerHTML = '';
                // // i18n()
                // for (let i = 0; i < feed_length; i++) {
                //     previewHTML += `
                //                     <div class="image-priview" >
                //                     <img src="${golden_image[i]}" alt="" class="w-100 h-100" >
                //                     </div>
                //         `
                // }
                // image_preview_wrapper.innerHTML = previewHTML;
                // // i18n()



            }, (error, msg) => {

            })
        } else if (workstation_type == 'cobot' && false) {
            add_waypoint_btn.classList.remove('invisible')
            waypoints_wrap.classList.remove('invisible')
            start_capture_btn.textContent = 'Record Waypoint'
            post('/part_capture/record_waypoint', { part_id: id }, async (result, msg) => {
                if (msg) {
                    // showToast("success", msg)
                } else {
                    //showToast("success", 'Operation Successfull')
                }
                start_capture_btn.removeAttribute('disabled')
                start_capture_btn.textContent = await translateIntermediateText('Record Waypoint')
                addWaypoint(result?.data?.waypoint_details[0])

                upload_btn.classList.remove("d-none")
                download_btn.classList.remove("d-none")
                // finish_capture_btn.classList.remove("invisible")
                golden_image = result?.data?.golden_image
                const feed_length = seletedPart.workstation_cameras.length
                //console.log("---------", result?.data, feed_length, golden_image)
                for (let i = 0; i < feed_length; i++) {
                    const camera_feed = document.getElementById(`camera-feed-${i}`)
                    //////console.log(golden_image[i])
                    camera_feed.setAttribute('src', golden_image[i])
                }
                did_capture_golden_image = true

            }, (error, msg) => {
                if (msg) {
                    //window.livisapi.livisShowNotification(msg);
                    showToast('danger', msg)
                } else {
                    //window.livisapi.livisShowNotification(error.message);
                    showToast('danger', error.message)
                }
            })


        } else if (workstation_type == 'conveyor' || workstation_type == 'cobot') {
            const seletedPart = JSON.parse(localStorage.getItem('part'))
            const part_id = seletedPart._id['$oid']
            var golden_capture_payload = {
                part_id: part_id,
                is_transit: is_transit,
                waypoint_id: current_waypoint
            }
            // console.log(golden_capture_payload);
            add_waypoint_btn.disabled = false
            upload_btn.classList.remove('d-none')
            post('/part_capture/recapture_waypoint', golden_capture_payload, (result, msg) => {
                if (msg) {
                    // showToast("success", msg)   //show when necessary
                } else {
                    //showToast("success", 'Operation Successfull')
                }
                // console.log(result);
                const feed_length = seletedPart.workstation_cameras.length
                add_waypoint_btn.disabled = false
                upload_btn.classList.remove('d-none')
                updateCameraFeeds(feed_length);
                upload_btn_btn.removeAttribute('onclick')
                upload_btn_btn.addEventListener('click', uploadGoldenImages)
                upload_btn_btn.disabled = false
                showGoldenCaptureResult(result?.data?.golden_image)
                showToast('success', `Captured Successfully for Postion ${current_waypoint}`)

            }, (error, msg) => {
            })


        }

    } else {
        if (workstation_type == 'cobot') {
            const seletedPart = JSON.parse(localStorage.getItem('part'))
            const part_id = seletedPart._id
            const waypoints_wrap = document.getElementById("waypoints-wrap")
            waypoints_wrap.classList.remove("invisible")

            eventSource = new EventSource(`${BASE_URL}/start_capture_poll`); // Replace with your server's SSE endpoint URL

            // Add event listeners for different types of events
            eventSource.addEventListener("message", async function (event) {
                const response = JSON.parse(event?.data) ? JSON.parse(event?.data)?.result?.data : {}
                console.log('hi', response)
                const cycle_wrap = document.getElementById("cycle-wrap")
                // const live_cycle_block = document.getElementById("live-cycle-block")
                // live_cycle_block.classList.remove("col-md-5")
                // live_cycle_block.classList.add("col-md-4")
                waypoints_wrap.classList.remove("col-md-7")
                // waypoints_wrap.classList.add("col-md-6")
                waypoints_wrap.classList.remove('invisible')


                const preview_block = document.getElementById("image-preview-block")
                const image_preview_wrapper = document.getElementById("image-preview-wrapper")
                const total_images_captured = document.getElementById("no-of-images-wrap")

                const start_cycle_btn = document.getElementById('start-cycle-btn')
                const stop_cycle_btn = document.getElementById('stop-cycle-btn')
                const start_capture_btn = document.getElementById('start-capture-btn')
                const stop_capture_btn = document.getElementById('stop-capture-btn')

                start_cycle_btn.classList.add('d-none')
                // stop_cycle_btn.classList.remove('d-none')
                start_capture_btn.disabled = false
                upload_btn_btn.disabled = true
                download_btn_btn.disabled = true
                let previewHTML = ``

                if (eventSource && response?.is_captured) {
                    cycle_wrap.classList.remove('invisible')
                    preview_block.classList.remove("invisible")
                    total_images_captured.classList.remove("invisible")
                    cycle_wrap.innerText = await translateIntermediateText("Cycle") + `: ${response?.cycle_number ? response?.cycle_number : 0} `
                    total_images_captured.innerText = await translateIntermediateText("Image Count") + `: ${response?.total_numbers ? response?.total_numbers : 0} `
                    console.log('cap', response);
                    if (response?.cycle == 0) {
                        upload_btn.classList.add("d-none")
                        download_btn.classList.add("d-none")
                    } else {
                        upload_btn.classList.remove("d-none")
                        download_btn.classList.remove("d-none")
                        upload_btn_btn.disabled = false
                        download_btn_btn.disabled = false
                    }
                    waypoints_wrap.innerHTML = '';
                    // i18n()

                    const last_waypoint = parseInt(response.current_waypoint.substring(1), 10);
                    while (waypoints_wrap.firstChild) {
                        waypoints_wrap.removeChild(waypoints_wrap.firstChild);
                    }
                    if (last_waypoint == 0) {
                        const newDiv = document.createElement("div");
                        newDiv.className = `livis-capture-position-wrap active`;
                        newDiv.textContent = `P0`;
                        newDiv.id = 'p0'
                        waypoints_wrap.appendChild(newDiv);
                    } else {
                        for (let i = 0; i <= last_waypoint; i++) {
                            let newDiv = document.createElement("div");
                            newDiv.className = `livis-capture-position-wrap ${((i) == last_waypoint) ? 'active' : ''}`;
                            newDiv.textContent = `P${i}`;  // You can customize the content here
                            newDiv.id = `P${i}`
                            waypoints_wrap.appendChild(newDiv);

                        }
                        document.getElementById(`P${last_waypoint}`).addEventListener('click', deleteWaypoint)
                    }
                    image_preview_wrapper.innerHTML = '';
                    // i18n()
                    var current_wayPoint = response.current_waypoint
                    console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
                    captureCameras = data_capture_image
                    data_capture_image = Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])
                    data_capture_imagekeys = Object.keys(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])

                    for (let i = 0; i < Object.keys(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]).length; i++) {
                        ////console.log(response?.data_capture_image)
                        // console.log(Object.keys(response?.data_capture_image))
                        // console.log(response?.data_capture_image[i][current_wayPoint])
                        // console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
                        previewHTML += `
                        <div div class="image-priview" >
                        <img src="${data_capture_image[i][data_capture_image[i].length - 1]}" alt="" class="w-100 h-100" >
                        </div>
                        `
                    }
                    const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
                    for (let i = 0; i < workstation_data?.camera?.length; i++) {
                        const camera_feed = document.getElementById(`camera-feed-${data_capture_imagekeys[i]}`)
                        //////console.log(golden_image[i])
                        if (camera_feed) {
                            console.log('<----->', data_capture_image[i][data_capture_image[i].length - 1]);
                            camera_feed.setAttribute('src', data_capture_image[i][data_capture_image[i].length - 1])
                            camera_feed.setAttribute('width', '100%')
                            camera_feed.setAttribute('height', '100%')
                        }

                    }
                    ////console.log(previewHTML)
                    image_preview_wrapper.innerHTML = previewHTML;
                    // i18n()
                    // start_capture_btn.removeAttribute('disabled')
                    // start_capture_btn.innerText = await translateIntermediateText("Start Capture")
                    // seletedTag('UNSORTED')
                    ////console.log("SSE Connection closed");
                }

                if (response?.inspection_running_status) {
                    start_capture_btn.classList.add('d-none')
                    stop_capture_btn.classList.remove('d-none')
                }
            });

            eventSource.addEventListener("open", function (event) {
                // Handle 'open' event (connection established)
                ////console.log("SSE Connection is open");
            });

            eventSource.addEventListener("error", function (event) {
                // Handle 'error' event (connection error)
                if (event.target.readyState === EventSource.CLOSED) {
                    ////console.log("SSE Connection was closed");
                } else {
                    console.error("SSE Connection error:", event);
                }
            });
        } else if (workstation_type == 'static') {
            const seletedPart = JSON.parse(localStorage.getItem('part'))
            const part_id = seletedPart._id
            post('/part_capture/static_data_capture', { part_id: part_id, waypoint_id: 'P0' }, async (result, msg) => {
                if (msg) {
                    // showToast("success", msg)
                } else {
                    //showToast("success", 'Operation Successfull')
                }
                const undo_btn = document.getElementById("undo-btn")
                undo_btn.disabled = false
                undo_btn.classList.remove("invisible")
                const cycle_wrap = document.getElementById("cycle-wrap")
                cycle_wrap.classList.remove('invisible')
                cycle_wrap.innerText = await translateIntermediateText("Cycle") + `: ${result?.data?.cycle} `
                const total_images_captured = document.getElementById("no-of-images-wrap")
                total_images_captured.classList.remove("invisible")
                total_images_captured.innerText = await translateIntermediateText("Image Count") + `: ${result?.data?.total} `
                const live_cycle_block = document.getElementById("live-cycle-block")
                // live_cycle_block.classList.remove("col-md-2")
                // live_cycle_block.classList.add("col-md-4")
                const waypoints_wrap = document.getElementById("waypoints-wrap")
                waypoints_wrap.classList.remove("col-md-7")
                waypoints_wrap.classList.add("col-md-7")
                const preview_block = document.getElementById("image-preview-block")
                preview_block.classList.remove("invisible")
                const image_preview_wrapper = document.getElementById("image-preview-wrapper")
                data_capture_image = result?.data?.data_capture_image
                start_capture_btn.removeAttribute('disabled')
                // start_capture_btn.textContent = await translateIntermediateText('Capture')
                captureCameras = []
                cycle_wrap.innerText = await translateIntermediateText("Cycle") + `: ${result?.data?.cycle} `
                const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
                if (result?.data?.cycle == 0) {
                    upload_btn.classList.add("d-none")
                    download_btn.classList.add("d-none")
                } else {
                    upload_btn.classList.remove("d-none")
                    download_btn.classList.remove("d-none")
                }
                upload_btn_btn.disabled = false
                download_btn_btn.disabled = false
                var camera_index = 0;
                for (let i = 0; i < data_capture_image.length; i++) {
                    for (key in data_capture_image[i]['P0']) {
                        captureCameras.push([data_capture_image[i]['P0'][key][data_capture_image[i]['P0'][key].length - 1] ? data_capture_image[i]['P0'][key][data_capture_image[i]['P0'][key].length - 1] : '../common/image/camera-icon.svg']);

                    }
                }
                console.log(captureCameras);
                // Initial setup
                updateCameraFeeds(workstation_data?.camera?.length);

                let previewHTML = ``
                image_preview_wrapper.innerHTML = '';
                console.log(data_capture_image)
                // i18n()
                for (let i = 0; i < workstation_data?.camera?.length; i++) {
                    previewHTML += `
                                    <div class="image-priview" >
                                    <img src="${captureCameras[i]}" alt="" class="w-100 h-100" >
                                    </div>
                        `
                }
                image_preview_wrapper.innerHTML = previewHTML;
                // i18n()
            }, (error, msg) => {
                if (msg) {
                    //window.livisapi.livisShowNotification(msg);
                    // showToast('danger', msg)
                } else {
                    //window.livisapi.livisShowNotification(error.message);
                    // showToast('danger', error.message)
                }
            })
        } else if (workstation_type == 'conveyor') {
            const seletedPart = JSON.parse(localStorage.getItem('part'))
            const part_id = seletedPart._id
            const waypoints_wrap = document.getElementById("waypoints-wrap")
            waypoints_wrap.classList.remove("invisible")

            eventSource = new EventSource(`${BASE_URL}/start_capture_poll`); // Replace with your server's SSE endpoint URL

            // Add event listeners for different types of events
            eventSource.addEventListener("message", async function (event) {
                const response = JSON.parse(event?.data) ? JSON.parse(event?.data)?.result?.data : {}
                // console.log(response)
                const cycle_wrap = document.getElementById("cycle-wrap")
                // const live_cycle_block = document.getElementById("live-cycle-block")
                // live_cycle_block.classList.remove("col-md-5")
                // live_cycle_block.classList.add("col-md-4")
                waypoints_wrap.classList.remove("col-md-7")
                // waypoints_wrap.classList.add("col-md-6")
                waypoints_wrap.classList.remove('invisible')


                const preview_block = document.getElementById("image-preview-block")
                const image_preview_wrapper = document.getElementById("image-preview-wrapper")
                const total_images_captured = document.getElementById("no-of-images-wrap")

                const start_cycle_btn = document.getElementById('start-cycle-btn')
                const stop_cycle_btn = document.getElementById('stop-cycle-btn')
                const start_capture_btn = document.getElementById('start-capture-btn')
                const stop_capture_btn = document.getElementById('stop-capture-btn')

                start_cycle_btn.classList.add('d-none')
                // stop_cycle_btn.classList.remove('d-none')
                start_capture_btn.disabled = false
                upload_btn_btn.disabled = true
                download_btn_btn.disabled = true
                let previewHTML = ``
                if (JSON.parse(event?.data)?.inspection_running_status) {
                    start_capture_btn.classList.add('d-none')
                    stop_capture_btn.classList.remove('d-none')
                }
                else {
                    start_capture_btn.classList.remove('d-none')
                    stop_capture_btn.classList.add('d-none')
                }
                if (eventSource && response?.is_captured) {
                    cycle_wrap.classList.remove('invisible')
                    preview_block.classList.remove("invisible")
                    total_images_captured.classList.remove("invisible")
                    cycle_wrap.innerText = await translateIntermediateText("Cycle") + `: ${response?.cycle_number ? response?.cycle_number : 0} `
                    total_images_captured.innerText = await translateIntermediateText("Image Count") + `: ${response?.total_numbers ? response?.total_numbers : 0} `
                    if (response?.cycle == 0) {
                        upload_btn.classList.add("d-none")
                        download_btn.classList.add("d-none")
                    } else {
                        upload_btn.classList.remove("d-none")
                        download_btn.classList.remove("d-none")
                        upload_btn_btn.disabled = false
                        download_btn_btn.disabled = false
                    }
                    waypoints_wrap.innerHTML = '';
                    // i18n()

                    const last_waypoint = parseInt(response.current_waypoint.substring(1), 10);
                    while (waypoints_wrap.firstChild) {
                        waypoints_wrap.removeChild(waypoints_wrap.firstChild);
                    }
                    if (last_waypoint == 0) {
                        const newDiv = document.createElement("div");
                        newDiv.className = `livis-capture-position-wrap active`;
                        newDiv.textContent = `P0`;
                        newDiv.id = 'p0'
                        waypoints_wrap.appendChild(newDiv);
                    } else {
                        for (let i = 0; i <= last_waypoint; i++) {
                            let newDiv = document.createElement("div");
                            newDiv.className = `livis-capture-position-wrap ${((i) == last_waypoint) ? 'active' : ''}`;
                            newDiv.textContent = `P${i}`;  // You can customize the content here
                            newDiv.id = `P${i}`
                            waypoints_wrap.appendChild(newDiv);

                        }
                        document.getElementById(`P${last_waypoint}`).addEventListener('click', deleteWaypoint)
                    }
                    image_preview_wrapper.innerHTML = '';
                    // i18n()
                    var current_wayPoint = response.current_waypoint
                    // console.log(response?.data_capture_image)
                    // console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
                    data_capture_image = Object.values(response?.data_capture_image[response?.data_capture_image?.length - 1][current_wayPoint])
                    captureCameras = data_capture_image
                    data_capture_imagekeys = Object.keys(response?.data_capture_image[response?.data_capture_image?.length - 1][current_wayPoint])
                    updateCameraFeeds(data_capture_image.length)
                    console.log('images', data_capture_image);
                    console.log('images keys', data_capture_imagekeys);
                    for (let i = 0; i < data_capture_image.length; i++) {
                        ////console.log(response?.data_capture_image)
                        // console.log(Object.keys(response?.data_capture_image))
                        // console.log(response?.data_capture_image[i][current_wayPoint])
                        // console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
                        previewHTML += `
                        <div div class="image-priview" >
                        <img src="${data_capture_image[i][data_capture_image[i]?.length - 1]}" alt="" class="w-100 h-100" >
                        </div>
                        `
                    }
                    // data_capture_image = Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])
                    const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
                    for (let i = 0; i < workstation_data?.camera?.length; i++) {
                        const camera_feed = document.getElementById(`camera-feed-${data_capture_imagekeys[i]}`)
                        console.log(camera_feed);
                        console.log(`camera-feed-${data_capture_imagekeys[i]}`);
                        console.log(data_capture_image[i][data_capture_image[i]?.length - 1]);
                        //////console.log(golden_image[i])
                        if (camera_feed && data_capture_image[i][data_capture_image[i]?.length - 1]) {
                            camera_feed.setAttribute('src', data_capture_image[i][data_capture_image[i]?.length - 1])
                            camera_feed.setAttribute('width', '100%')
                            camera_feed.setAttribute('height', '100%')
                        }

                    }
                    ////console.log(previewHTML)
                    image_preview_wrapper.innerHTML = previewHTML;
                    // i18n()
                    // start_capture_btn.removeAttribute('disabled')
                    // start_capture_btn.innerText = await translateIntermediateText("Start Capture")
                    // seletedTag('UNSORTED')
                    ////console.log("SSE Connection closed");
                }

            });

            eventSource.addEventListener("open", function (event) {
                // Handle 'open' event (connection established)
                ////console.log("SSE Connection is open");
            });

            eventSource.addEventListener("error", function (event) {
                // Handle 'error' event (connection error)
                if (event.target.readyState === EventSource.CLOSED) {
                    ////console.log("SSE Connection was closed");
                } else {
                    console.error("SSE Connection error:", event);
                }
            });
        }
    }

}

/**
 * Sets up an event listener on the form with ID 'transit_point'.
 * When the form is submitted, it determines if the transit point should be set based on the selected radio button.
 * Hides the 'add_waypoint_modal' modal after submission.
 */
function setTransitPoint() {
    document.getElementById('transit_point').addEventListener("submit", function (e) {
        e.preventDefault();
        const transit = document.getElementById('radio-2')
        if (transit.checked)
            is_transit = true
        else
            is_transit = false

        add_waypoint_modal.hide()
    });
}

/**
 * Starts the upload process for golden images.
 * Retrieves the part ID from localStorage and sends a POST request to upload golden images.
 * Displays a success toast and disables the upload button. Redirects to the home page upon successful upload.
 */
function uploadGoldenImages() {
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const part_id = seletedPart._id['$oid']
    const upload_btn_btn = document.getElementById("upload-btn-btn")

    post("/part_capture/golden_image_upload", { part_id: part_id }, (result, msg) => {
        showToast('success', 'Upload Started')
        upload_btn_btn.disabled = true
        window.location.href = "../home/home.html"
    }, (error, msg) => {
        upload_btn_btn.disabled = false
    })
}

/**
 * Initializes the capture process based on the workstation type.
 * If the workstation type is 'conveyor' or 'cobot', fetches multistage data and updates button states.
 * Otherwise, starts the capture process directly.
 */

function startCapturetrigger() {
    const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))

    updateCameraFeeds(workstation_data?.camera?.length);


    const stop_cycle_btn = document.getElementById('stop-cycle-btn')
    const start_capture_btn = document.getElementById('start-capture-btn')
    const workstation_type = localStorage.getItem('workstation_type')
    const stop_capture_btn = document.getElementById('stop-capture-btn')
    const upload_btn_btn = document.getElementById('upload-btn-btn')
    const download_btn_btn = document.getElementById('download-btn-btn')

    stop_cycle_btn.disabled = true
    start_capture_btn.disabled = true
    if (workstation_type === 'conveyor' || workstation_type === 'cobot') {
        get("/multistage_data_capture", (result, msg) => {
            console.log('start');
            stop_cycle_btn.disabled = false
            start_capture_btn.disabled = false
            start_capture_btn.classList.add('d-none')
            stop_capture_btn.classList.remove('d-none')
            upload_btn_btn.disabled = false
            download_btn_btn.disabled = false
            showCaptureResult(result)
        }, (err, msg) => {
            // console.log(err)
            // alert("yes")
            const undo_btn = document.getElementById("undo-btn")
            undo_btn.disabled = true
            undo_btn.classList.add("invisible")
        })
    }
    else {
        console.log('here');
        startCapture()
    }
}

/**
 * Stops the capture process.
 * If the workstation type is 'conveyor' or 'cobot', sends a request to stop capturing and updates button states.
 */
function stopCapturetrigger() {
    const stop_cycle_btn = document.getElementById('stop-cycle-btn')
    const start_capture_btn = document.getElementById('start-capture-btn')
    const workstation_type = localStorage.getItem('workstation_type')
    const stop_capture_btn = document.getElementById('stop-capture-btn')
    const upload_btn_btn = document.getElementById('upload-btn-btn')
    const download_btn_btn = document.getElementById('download-btn-btn')

    stop_cycle_btn.disabled = true
    start_capture_btn.disabled = true
    if (workstation_type === 'conveyor' || workstation_type === 'cobot') {
        get("/stop_capturing", (result, msg) => {
            console.log('stop');
            stop_cycle_btn.disabled = false
            start_capture_btn.disabled = false
            start_capture_btn.classList.remove('d-none')
            stop_capture_btn.classList.add('d-none')
            upload_btn_btn.disabled = false
            download_btn_btn.disabled = false
        }, (err, msg) => {
            // console.log(err)
            // alert("yes")
            const undo_btn = document.getElementById("undo-btn")
            undo_btn.disabled = true
            undo_btn.classList.add("invisible")
        })
    }
}

/**
 * Displays the results of the capture process.
 * Updates the UI with information such as cycle number, image count, and captured images.
 * Also updates camera feeds with the latest captured images.
 */
async function showCaptureResult(event) {
    // console.log('in show capture', event);
    const response = event?.data ? event?.data : {}
    console.log('hi', response)
    const cycle_wrap = document.getElementById("cycle-wrap")
    // const live_cycle_block = document.getElementById("live-cycle-block")
    // live_cycle_block.classList.remove("col-md-5")
    // live_cycle_block.classList.add("col-md-4")
    waypoints_wrap.classList.remove("col-md-7")
    // waypoints_wrap.classList.add("col-md-6")
    waypoints_wrap.classList.remove('invisible')

    const preview_block = document.getElementById("image-preview-block")
    const image_preview_wrapper = document.getElementById("image-preview-wrapper")
    const total_images_captured = document.getElementById("no-of-images-wrap")

    const start_cycle_btn = document.getElementById('start-cycle-btn')
    const stop_cycle_btn = document.getElementById('stop-cycle-btn')
    const start_capture_btn = document.getElementById('start-capture-btn')

    const upload_btn = document.getElementById('upload-btn')
    // start_cycle_btn.classList.add('d-none')
    // stop_cycle_btn.classList.remove('d-none')
    start_capture_btn.disabled = false
    let previewHTML = ``

    if (response?.is_captured) {
        console.log('is caotured');
        cycle_wrap.classList.remove('invisible')
        preview_block.classList.remove("invisible")
        total_images_captured.classList.remove("invisible")
        cycle_wrap.innerText = await translateIntermediateText("Cycle") + ` : ${response?.cycle_number ? response?.cycle_number : 0} `
        total_images_captured.innerText = await translateIntermediateText("Image Count") + `: ${response?.total_numbers ? response?.total_numbers : 0} `

        // if (response?.cycle_number == 0) {
        //     upload_btn.classList.add("d-none")
        //     download_btn.classList.add("d-none")
        // } else {
        //     upload_btn.classList.remove("d-none")
        //     download_btn.classList.remove("d-none")
        // }
        console.log('is caotured');

        waypoints_wrap.innerHTML = '';
        // i18n()

        const last_waypoint = parseInt(response.current_waypoint.substring(1), 10);
        console.log(last_waypoint);
        while (waypoints_wrap.firstChild) {
            waypoints_wrap.removeChild(waypoints_wrap.firstChild);
        }
        if (last_waypoint == 0) {
            const newDiv = document.createElement("div");
            newDiv.className = `livis-capture-position-wrap active`;
            newDiv.textContent = `P0`;
            waypoints_wrap.appendChild(newDiv);
        } else {
            for (let i = 0; i <= last_waypoint; i++) {
                let newDiv = document.createElement("div");
                newDiv.className = `livis-capture-position-wrap ${((i) == last_waypoint) ? 'active' : ''}`;
                newDiv.textContent = `P${i}`;  // You can customize the content here
                newDiv.id = `P${i}`
                waypoints_wrap.appendChild(newDiv);

            }
            document.getElementById(`P${last_waypoint}`).addEventListener('click', () => {
                deleteWaypoint
            })
        }
        var current_wayPoint = response.current_waypoint
        // console.log(response?.data_capture_image)
        // console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
        data_capture_image = Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])
        captureCameras = data_capture_image
        data_capture_imageKeys = Object.keys(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])
        console.log('images', data_capture_image);
        console.log('images keys', data_capture_imageKeys);
        for (let i = 0; i < data_capture_image.length; i++) {
            ////console.log(response?.data_capture_image)
            // console.log(Object.keys(response?.data_capture_image))
            // console.log(response?.data_capture_image[i][current_wayPoint])
            // console.log(Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint]))
            // console.log('(.)(.)', data_capture_image[i][data_capture_image[i].length - 1]);
            previewHTML += `
                        <div div class="image-priview" >
                        <img src="${data_capture_image[i][data_capture_image[i].length - 1]}" alt="" class="w-100 h-100" >
                        </div>
                        `
        }
        // data_capture_image = Object.values(response?.data_capture_image[response?.data_capture_image.length - 1][current_wayPoint])
        const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
        for (let i = 0; i < workstation_data?.camera?.length; i++) {
            const camera_feed = document.getElementById(`camera-feed-${data_capture_imageKeys[i]}`)
            //////console.log(golden_image[i])
            console.log('()()', data_capture_image[i][data_capture_image[i]?.length - 1]);
            if (camera_feed) {
                camera_feed.setAttribute('src', data_capture_image[i][data_capture_image[i]?.length - 1])
                camera_feed.setAttribute('width', '100%')
                camera_feed.setAttribute('height', '100%')
            }

        }
        ////console.log(previewHTML)
        image_preview_wrapper.innerHTML = previewHTML;
        // const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
        // for (let i = 0; i < workstation_data?.camera?.length; i++) {
        //     const camera_feed = document.getElementById(`camera-feed-${i}`)
        //     //////console.log(golden_image[i])
        //     camera_feed.setAttribute('src', data_capture_image[i])
        //     camera_feed.setAttribute('width', '100%')
        //     camera_feed.setAttribute('height', '100%')
        // }
        ////console.log(previewHTML)
        image_preview_wrapper.innerHTML = previewHTML;
        // i18n()
        // start_capture_btn.removeAttribute('disabled')
        // start_capture_btn.innerText = await translateIntermediateText("Start Capture")
        // seletedTag('UNSORTED')
        ////console.log("SSE Connection closed");
    }
}


/**
 * Ends the capture session and redirects to the home page.
 */
function endCapture() {
    window.location.href = '../home/home.html'
}

/**
 * Deletes a waypoint if the cycle has stopped.
 * Displays a warning toast if trying to delete a waypoint while the cycle is active.
 */
function deleteWaypoint() {
    console.log('delete way point');
    const seletedPart = JSON.parse(localStorage.getItem('part'))
    const part_id = seletedPart._id
    console.log(document.getElementById('stop-cycle-btn').classList);
    if (!document.getElementById('stop-cycle-btn').classList.contains('d-none')) {
        showToast('danger', 'Cannot Delete waypoint, Please Start Cycle')
    } else {
        post("/part_capture/delete_waypoint", { part_id: part_id }, (result, msg) => {
            showToast('success', 'Position Deleted')
        }, (error, msg) => { })
    }

}


/**
 * Handles undoing the capture process.
 * If the workstation type is 'static', sends a request to delete static data capture and updates the UI.
 */
async function undoCapture() {
    const workstation_type = localStorage.getItem('workstation_type')
    if (workstation_type === "static") {
        get("/part_capture/delete_static_data_capture", async (result, msg) => {

            const upload_btn = document.getElementById("upload-btn")
            const download_btn = document.getElementById("download-btn")
            const cycle_wrap = document.getElementById("cycle-wrap")
            cycle_wrap.classList.remove('invisible')
            cycle_wrap.innerText = await translateIntermediateText("Cycle") + `: ${result?.data?.cycle} `
            const total_images_captured = document.getElementById("no-of-images-wrap")
            total_images_captured.classList.remove("invisible")
            total_images_captured.innerText = await translateIntermediateText("Image Count") + `: ${result?.data?.total} `
            if (result?.data?.cycle == 0) {
                upload_btn.classList.add("d-none")
                download_btn.classList.add("d-none")
            } else {
                upload_btn.classList.remove("d-none")
                download_btn.classList.remove("d-none")
            }

            if (result?.data?.cycle <= 0) {
                // console.log("first return")
                const undo_btn = document.getElementById("undo-btn")
                undo_btn.disabled = true
                undo_btn.classList.add("invisible")

                const image_preview_wrapper = document.getElementById("image-preview-wrapper")
                const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
                //console.log("---------", result?.data, workstation_data?.camera?.length, data_capture_image)
                for (let i = 0; i < workstation_data?.camera?.length; i++) {
                    const camera_feed = document.getElementById(`camera-feed-${i}`)
                    if (!camera_feed) break
                    //////console.log(golden_image[i])
                    camera_feed.setAttribute('src', '../common/image/camera-icon.svg')
                    camera_feed.setAttribute('width', '100%')
                    camera_feed.setAttribute('height', '100%')
                }
                let previewHTML = ``
                image_preview_wrapper.innerHTML = '';
                // i18n()
                for (let i = 0; i < workstation_data?.camera?.length; i++) {
                    previewHTML += `
                                <div class="image-priview">
                                    <img src="../common/image/camera-icon.svg" alt="">
                                </div>
                            `
                }
                ////console.log(previewHTML)
                image_preview_wrapper.innerHTML = previewHTML;
                // i18n()
                return
            }
            data_capture_image = result?.data?.data_capture_image
            const image_preview_wrapper = document.getElementById("image-preview-wrapper")
            const workstation_data = JSON.parse(localStorage.getItem('workstation_data'))
            //console.log("---------", result?.data, workstation_data?.camera?.length, data_capture_image)
            for (let i = 0; i < workstation_data?.camera?.length; i++) {
                const camera_feed = document.getElementById(`camera-feed-${i}`)
                if (!camera_feed) break
                //////console.log(golden_image[i])
                camera_feed.setAttribute('src', data_capture_image[i])
                camera_feed.setAttribute('width', '100%')
                camera_feed.setAttribute('height', '100%')
            }
            let previewHTML = ``
            // console.log("first")
            for (let i = 0; i < workstation_data?.camera?.length; i++) {
                // console.log("first need", data_capture_image[i])

                previewHTML += `
                                    <div class="image-priview" >
                                    <img src="${data_capture_image[i]}" alt="" class="w-100 h-100" >
                                    </div>
                        `
            }
            // console.log(previewHTML)
            image_preview_wrapper.innerHTML = previewHTML;
            // i18n()



        }, (err, msg) => {
            // console.log(err)
            // alert("yes")
            const undo_btn = document.getElementById("undo-btn")
            undo_btn.disabled = true
            undo_btn.classList.add("invisible")
        })
    }
}

/**
 * Cleans up before the page unloads.
 * Removes specific items from localStorage and closes any open event sources.
 * Redirects to the home page.
 */
window.addEventListener('beforeunload', function (event) {
    localStorage.removeItem('capture_type');
    localStorage.removeItem('part');
    localStorage.removeItem('usecase');
    localStorage.removeItem('workstation_type');
    localStorage.removeItem('workstation_data');
    if (eventSource) {
        eventSource.close();
        ////console.log("SSE Connection closed");
    }
    goToHome()
});









// const usecase_dropdown_input = document.getElementById("livis-searchable-dropdown-usecase")
// const usecase_dropdown_list = document.getElementById("livis-searchable-list-usecase")
// document.addEventListener('click', () => {
//     if (document.activeElement !== usecase_dropdown_input) {
//         usecase_dropdown_list.style.display = 'none'
//     }
// })
// usecase_dropdown_input.addEventListener('click', () => {
//     usecase_dropdown_list.style.display = 'block'
// })


/**
 * Toggles the visibility of the image preview block based on user input.
 * Saves the preference in localStorage.
 */
function toggleImagePreview() {
    const toggle_image_preview_btn = document.getElementById("toggle-image-preview")
    const preview_block = document.getElementById("image-preview-block")
    if (toggle_image_preview_btn.checked) {
        preview_block.classList.remove("d-none")
        localStorage.setItem("show-preview", true)
    } else {
        preview_block.classList.add("d-none")
        localStorage.setItem("show-preview", false)
    }
}

/**
 * Initializes the page state based on saved preferences in localStorage.
 * Configures the visibility of the image preview block and button states.
 */
function ngOnInit() {
    const show_preview = localStorage.getItem("show-preview")
    console.log(show_preview)
    const toggle_image_preview_btn = document.getElementById("toggle-image-preview")
    const preview_block = document.getElementById("image-preview-block")
    const upload_btn_btn = document.getElementById('upload-btn-btn')
    const download_btn_btn = document.getElementById('download-btn-btn')
    if (show_preview == 'true') {
        toggle_image_preview_btn.checked = true
        preview_block.classList.remove("d-none")
    } else {
        toggle_image_preview_btn.checked = false
        preview_block.classList.add("d-none")
    }
    upload_btn_btn.disabled = true
    download_btn_btn.disabled = true
}

/**
 * Shows the PLC configuration modal.
 */
function configurePLC() {
    livis_PLC_configur_modal.show()
}

ngOnInit()


/**
 * Rejects a golden image capture request and redirects to the home page.
 * Displays a loading indicator while processing the rejection.
 */
function rejectGoldenImageCapture() {
    setIsLoading(true, 'Please wait ...')
    const part_data = JSON.parse(localStorage.getItem('notify_part'))
    post("/part_capture/deny_connection_request", { temp_part_data: part_data }, (result, msg) => {
        localStorage.removeItem("notify_part")
        setIsLoading(false, 'Please wait ...')
        window.location.href = "../home/home.html"
    }, (error, msg) => { })
}


/**
 * Redirects to the home page.
 * If the capture type is 'golden' and no golden images were captured, rejects the capture request.
 * Otherwise, stops the capture cycle if necessary and then redirects.
 */
function goToHome() {
    const capture_type = paramName
    console.log(paramName)
    if (capture_type == 'golden') {
        if (!did_capture_golden_image) {
            rejectGoldenImageCapture()
        } else {
            window.location.href = "../home/home.html"
        }
    } else {
        const workstation_type = localStorage.getItem('workstation_type')
        if (workstation_type != 'static')
            stopCaptureCycle()
        window.location.href = "../home/home.html"
    }
}
