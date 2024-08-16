
let selectedPosition = 0
let singleReportData = {}
var filter_payload = {
    from_date: "",
    to_date: "",
    part_name: "",
    status: "",
    batch_name: "",
    // defects: "",
    // features: "",
    text: "",
    skip: 0,
    limit: 20,
    view: "batch"
}

var show_inferred_images = true
const search_btn = document.getElementById("search-btn")
const download_btn = document.getElementById("download-btn")
const batch_view_button = document.getElementById("batch_view")
batch_view_button.checked = true

/**
 * Event listener for clicks outside dropdown inputs to hide dropdown lists.
 */
document.addEventListener('click', () => {
    if (document.activeElement !== part_dropdown_input) {
        part_dropdown_list.style.display = 'none'
    }
    if (document.activeElement !== time_dropdown_input) {
        time_dropdown_list.style.display = 'none'
    }
    if (document.activeElement !== batch_dropdown_input) {
        batch_dropdown_list.style.display = 'none'
    }
    // if (document.activeElement !== shift_dropdown_input) {
    //     shift_dropdown_list.style.display = 'none'
    // }
    // if (document.activeElement !== feature_dropdown_input) {
    //     feature_dropdown_list.style.display = 'none'
    // }
    if ((filter_payload.part_name == '' || filter_payload.status == '' || filter_payload.from_date == '' || filter_payload.to_date == '') && filter_payload.view == 'batch') {
        download_btn.disabled = true
    }
    else
        download_btn.disabled = false

})

/**
 * Event listener for batch view switch to toggle between batch and inspection views.
 */
batch_view_button.addEventListener('change', function () {
    if (this.checked) {
        // Do something when switch is on
        filter_payload.view = "batch"
        search_btn.classList.remove("d-none")
        download_btn.classList.remove("d-none")

        getMegaReport()
    } else {
        // getMegaReport()
        filter_payload.view = "inspection"
        search_btn.classList.remove("d-none")
        download_btn.classList.remove("d-none")
        // Do something when switch is off
        getMegaReport()

    }
});


/**
 * Event listener to display the batch dropdown list on input click.
 */
//batch filter
const batch_dropdown_input = document.getElementById("livis-searchable-dropdown-batch")
const batch_dropdown_list = document.getElementById("livis-searchable-list-batch")
batch_dropdown_input.addEventListener('click', () => {
    batch_dropdown_list.style.display = 'block'
})
let batches = []

/**
 * Fetches and displays all batches for the batch dropdown list.
 */
function getAllBatches() {
    setIsLoading(true, 'Please Wait Until we load the reports')
    get("/get_all_batches", (result, msg) => {

        setIsLoading(false, 'Please Wait Until we load the reports')
        //console.log(result?.data)
        batches = result?.data?.data
        let batches_HTML = ``
        for (let i = 0; i < batches.length; i++) {

            batches_HTML += `<div onClick="getBatchName('${batches[i]?.batch_name}')">${batches[i]?.batch_name}</div>`
        }
        batch_dropdown_list.innerHTML = batches_HTML;
        i18n()
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
 * Handles selection of a batch from the dropdown list.
 */
const batch_items = batch_dropdown_list.getElementsByTagName("div");
for (const item of batch_items) {
    item.addEventListener('click', function () {
        const batch_name = this.textContent;
        getBatchName(batch_name);
    });
}

/**
 * Sets the selected batch name and updates filter payload.
 */
function getBatchName(value) {
    batch_dropdown_input.value = value
    filter_payload.batch_name = value
    //console.log(filter_payload);
    search_btn.classList.remove("d-none")
    download_btn.classList.remove("d-none")
    // getMegaReport()
}


/**
 * Event listener to display the part dropdown list on input click.
 */
//part filter
const part_dropdown_input = document.getElementById("livis-searchable-dropdown-part")
const part_dropdown_list = document.getElementById("livis-searchable-list-part")
part_dropdown_input.addEventListener('click', () => {
    part_dropdown_list.style.display = 'block'
})
let parts = []

/**
 * Fetches and displays all parts for the part dropdown list.
 */
function getAllParts() {
    setIsLoading(true, 'Please Wait Until we load the reports')
    get("/get_all_parts_for_workstation", (result, msg) => {

        setIsLoading(false, 'Please Wait Until we load the reports')
        //console.log(result?.data)
        parts = result?.data?.part_data
        let parts_HTML = ``

        for (let i = 0; i < parts.length; i++) {
            parts_HTML += `<div onClick="getPartName('${parts[i]?.part_name}')">${parts[i]?.part_name} (${parts[i]?.part_number})</div>`
        }
        part_dropdown_list.innerHTML = parts_HTML;
        i18n()
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
 * Handles selection of a part from the dropdown list.
 */

const part_items = part_dropdown_list.getElementsByTagName("div");
for (const item of part_items) {
    item.addEventListener('click', function () {
        const part_name = this.textContent;
        getPartName(part_name);
    });
}

/**
 * Sets the selected part name and updates filter payload.
 */
function getPartName(value) {
    part_dropdown_input.value = value
    filter_payload.part_name = value
    search_btn.classList.remove("d-none")
    download_btn.classList.remove("d-none")
    // getMegaReport()
}


/**
 * Event listener to display the status dropdown list on input click.
 */
//status filter
const time_dropdown_input = document.getElementById("livis-searchable-dropdown-time")
const time_dropdown_list = document.getElementById("livis-searchable-list-time")
time_dropdown_input.addEventListener('click', () => {
    time_dropdown_list.style.display = 'block'
})
let status_search_dropdown = [
    {
        status: 'All',
        value: "",
        translationKey: 'All'
    },
    {
        status: 'Accepted',
        value: true,
        translationKey: 'accepted'
    },
    {
        status: 'Rejected',
        value: false,
        translationKey: 'rejected'
    }
];

let status_HTML = ``

// To populate dropdown options dynamically with translation keys
for (let i = 0; i < status_search_dropdown.length; i++) {
    status_HTML += `<div data-i18n="${status_search_dropdown[i]?.translationKey}" onClick="getStatusName('${status_search_dropdown[i]?.value}', '${status_search_dropdown[i]?.status}')">${status_search_dropdown[i]?.status}</div>`;
}
time_dropdown_list.innerHTML = status_HTML;
// i18n()

/**
 * Filters status dropdown items based on user input.
 */
time_dropdown_input.addEventListener("input", function () {
    const filter = time_dropdown_input.value.toLowerCase();
    const items = time_dropdown_list.getElementsByTagName("div");
    for (const item of items) {
        const text = item.textContent.toLowerCase();
        //console.log(text)
        if (text.includes(filter)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    }
});


/**
 * Handles selection of a status from the dropdown list and updates filter payload.
 */
async function getStatusName(value, status) {
    time_dropdown_input.value = status

    // Fetch translation for the clicked status
    const translated_status = await translateIntermediateText(status);
    if (translated_status !== status) {
        time_dropdown_input.value = translated_status;
    }

    if (value === "") {
        filter_payload.status = value
    } else {
        filter_payload.status = JSON.parse(value)
    }
    search_btn.classList.remove("d-none")
    download_btn.classList.remove("d-none")
    // getMegaReport()
}






var reports_data = []
var reports_count = 0
const reports_data_body = document.getElementById("reports-data-body")



const current_date = new Date();
const three_months_ago = new Date();
three_months_ago.setDate(current_date.getDate() - 90);
// Get the day, month, and year components
const day = String(current_date.getDate()).padStart(2, '0'); // Ensure two digits
const month = String(current_date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
const year = current_date.getFullYear();
// Combine the components in the "dd/mm/yyyy" format
const formatted_date = `${month}/${day}/${year}`;
//console.log(formatted_date)
const date_range_picker = document.getElementById("date-range-picker")
const date_range_string = document.getElementById("date-range-string")
date_range_picker.value = `${formatted_date} - ${formatted_date}`
/**
 * Initializes a date range picker for the input field with the name "daterange".
 * The date range picker allows the user to select a date range with specific options.
 * @returns None
 */
$(function () {
    $('input[name="daterange"]').daterangepicker({
        opens: 'left',
        maxDate: current_date,
        minDate: three_months_ago,
        isInvalidDate: function (date) {
            // Disable future dates
            return date > current_date;
        },
    }, function (start, end, label) {
        //console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
        filter_payload.from_date = start.format('YYYY-MM-DD') + " 00:00:00"
        filter_payload.to_date = end.format('YYYY-MM-DD') + " 23:59:59"
        date_range_string.innerText = `${filter_payload?.from_date?.split(" ")[0]} - ${filter_payload?.to_date?.split(" ")[0]}`
        search_btn.classList.remove("d-none")
        download_btn.classList.remove("d-none")
    });
});



/**
 * Consolidates feature and defect data from the report.
 */
function consolidateFeaturesAndDefects(data) {
    const consolidated_features = {};
    const consolidated_defects = {};

    // Iterate through "M" objects
    for (const mKey in data) {
        if (mKey.startsWith('M_')) {
            const mObject = data[mKey];

            // Iterate through "C" objects within the "M" object
            for (const cKey in mObject) {
                if (cKey.startsWith('C')) {
                    const cObject = mObject[cKey];

                    // Consolidate "feature_predicted" keys
                    Object.keys(cObject.feature_predicted).forEach((featureKey) => {
                        consolidated_features[featureKey] = (consolidated_features[featureKey] || 0) + 1;
                    });

                    // Consolidate "defects_predicted" keys
                    Object.keys(cObject.defects_predicted).forEach((defectKey) => {
                        consolidated_defects[defectKey] = (consolidated_defects[defectKey] || 0) + 1;
                    });
                }
            }
        }
    }
    //console.log({ consolidated_features, consolidated_defects })
    return { consolidated_features, consolidated_defects };
}


/**
 * Initiates report download request.
 */
function downloadReport() {
    get("/download_reports", (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            showToast("success", 'Reports Downloaded Succesfully')
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

const livis_searchable_text = document.getElementById("livis-searchable-text")

/**
 * Fetches and displays mega reports based on filter payload and view mode.
 */
function getMegaReport(batch_name, part_name, view) {

    //console.log('before payload', filter_payload)
    //console.log(batch_name, '-', part_name, '-', view)
    //console.log('part dropdown', part_dropdown_input.value);
    part_dropdown_input.value = part_name != undefined ? part_name : part_dropdown_input.value
    //console.log('setting value');
    filter_payload.text = livis_searchable_text.value
    filter_payload.part_name = part_name != undefined ? part_name : part_dropdown_input.value

    // filter_payload.batch_name = batch_dropdown_input.value != "" ? batch_dropdown_input.value : batch_name
    batch_dropdown_input.value = batch_name != undefined ? batch_name : batch_dropdown_input.value
    batch_dropdown_input.innerText = part_name != undefined ? batch_name : batch_dropdown_input.value;
    filter_payload.batch_name = batch_name != undefined ? batch_name : batch_dropdown_input.value


    filter_payload.view = view ? view : batch_view_button.checked ? "batch" : "inspection"
    batch_view_button.checked = filter_payload.view == "batch" ? true : false

    post("/get_mega_report", filter_payload, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
        getAllParts()
        getAllBatches()
        reports_data = result?.data?.docs_list
        reports_count = result?.data?.count
        let html = ``
        // //console.log(reports_data)
        if (reports_data?.length == 0) {
            html += `
                <div data-i18n="no_records_found" class="livis-no-plc-found">
                    No Records Found
                </div>
            `
            reports_data_body.innerHTML = html;
            i18n()
            updatePaginationButtons();
            return
        }
        if (result?.view == "inspections") {
            //console.log('in inspection', reports_data);
            document.title = "Inspection Reports"
            for (let i = 0; i < reports_data.length; i++) {
                // consolidateFeaturesAndDefects(reports_data[i].final_results)
                html += `
                        <div class="row position-relative livis-report-card m-0">
                            <div class="col-md-2 p-0">
                            `

                if (reports_data[i]?.recipe_results?.length > 0) {
                    const first_object = reports_data[i]?.recipe_results[0];
                    const first_object_values = Object.values(first_object);

                    if (first_object_values.length > 0) {
                        const first_inferred_image = first_object_values[0].inferred_image;

                        html += `
                        <img src="${first_inferred_image}" width="80%" height="100%" alt="inferred image" class="livis-report-main-img bg-dark" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';">
                        `
                    }
                }
                html += `</div>
                            <div class="col-md-2 ">
                                <div class="min-width livis-reports-created-at">${formatDateTime(reports_data[i]?.inspected_datetime)}</div>
                                <div class="livis-report-part">${reports_data[i].part_name}</div>
                            </div>
                            <div class="col-3">
                                <div class="livis-reports-created-at">${reports_data[i].part_number}</div>
                                <div  data-i18n="part_number"  class="livis-reports-title">Part Number</div>
                            </div>
                            <div class="col-md-2">
                                <div class="d-flex my-1 livis-reports-title"><span >Rejected Classes</span>: 
                                    <span class="${reports_data[i]?.overall_predicted_defects[0] ? 'livis-pill-reject' : 'ms-2'} ">${reports_data[i]?.overall_predicted_defects[0] ? reports_data[i]?.overall_predicted_defects[0] : '--'}</span>
                                    <span class="livis-pill-reject ${reports_data[i]?.overall_predicted_defects[1] ? 'd-flex' : 'd-none'}">${reports_data[i]?.overall_predicted_defects[1]}</span>
                                    <span class="livis-pill-reject ${reports_data[i]?.overall_predicted_defects.length > 2 ? 'd-flex' : 'd-none'}">+ ${reports_data[i]?.overall_predicted_defects.length - 2}</span>
                                </div>
                                <div class="d-flex my-1 livis-reports-title"> <span >Accepted Classes</span>: 
                                <span class="${reports_data[i]?.overall_predicted_features[0] ? 'livis-pill-accept' : 'ms-2'} ">${reports_data[i]?.overall_predicted_features[0] ? reports_data[i]?.overall_predicted_features[0] : '--'}</span>
                                    <span class="livis-pill-accept ${reports_data[i]?.overall_predicted_features[1] ? 'd-flex' : 'd-none'}">${reports_data[i]?.overall_predicted_features[1]}</span>
                                    <span class="livis-pill-accept ${reports_data[i]?.overall_predicted_features.length > 2 ? 'd-flex' : 'd-none'}">+ ${reports_data[i]?.overall_predicted_features.length - 2}</span>
                               </div>
                            </div>
                            <div class="col-md-1 status-btn-wrap">
                                <div class="livis-status-box ${reports_data[i]?.overall_acceptance ? 'accepted' : 'rejected'}">${reports_data[i]?.overall_acceptance ? 'Accepted' : 'Rejected'}</div>
                            </div>
                            <div class="col-md-1 view-btn-wrap">
                                <button class="btn btn-primary livis-operator-panel-secondary-btn"
                                    onclick="showReportsModal(${i})">View</button>
                            </div>
                        </div>
            `

            }
        } else if (result?.view == "batches") {
            // //console.log("in batches", reports_data);
            document.title = "Batch Reports"

            for (let i = 0; i < reports_data.length; i++) {
                // consolidateFeaturesAndDefects(reports_data[i].final_results)
                html += `
                        <div class="row position-relative livis-report-card m-0">
                            <div class="col-md-2 p-0">
                            `

                if (reports_data[i]) {
                    const thumbnail_image = reports_data[i]?.batch_data?.thumbnail_image ? reports_data[i]?.batch_data?.thumbnail_image : 'null'; //not implemented yet

                    if (thumbnail_image != null)
                        html += `
                        <img src="${thumbnail_image}" width="80%" height="100%" alt="thumbnail image" class="livis-report-main-img bg-dark" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';">
                        `
                    else
                        html += `
                        <img src="'../common/image/no_preview.svg'" width="80%" height="100%" alt="no preview" class="livis-report-main-img bg-dark" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';">
                        `
                }
                html += `</div>
                            <div class="col-md-3 ">
                                <div class="min-width livis-reports-created-at">${formatDateTime(reports_data[i]?.batch_data?.created_at)}</div>
                                <div class="livis-report-part">${reports_data[i]?.batch_data?.batch_name}</div>
                            </div>
                            <div class="col-md-2">
                                <div class="livis-reports-created-at">${reports_data[i]?.part_name}</div>
                                <div data-i18n="part_number" class="livis-reports-title">Part Number</div>
                            </div>
                            <div class="col-md-2">
                                <div class="d-flex my-1 livis-reports-title"><span data-i18n="rejected_count">Rejected Count</span>: 
                                    <span class="${reports_data[i]?.rejected_count ? 'livis-pill-reject' : 'ms-2'} ">${reports_data[i]?.rejected_count ? reports_data[i]?.rejected_count : '--'}</span>
                                </div>
                                <div class="d-flex my-1 livis-reports-title"> <span data-i18n="accepted_count">Accepted Count</span>: 
                                <span class="${reports_data[i]?.accepted_count ? 'livis-pill-accept' : 'ms-2'} ">${reports_data[i]?.accepted_count ? reports_data[i]?.accepted_count : '--'}</span>
                               </div>
                            </div>
                            <div class="col-md-2 status-btn-wrap">
                                <div class="livis-status-box ${reports_data[i]?.overall_batch_result ? 'accepted' : 'rejected'}">${reports_data[i]?.overall_batch_result ? 'Accepted' : 'Rejected'}</div>
                            </div>
                            <div class="col-md-1 view-btn-wrap">
                                <button data-i18n="view" class="btn btn-primary livis-operator-panel-secondary-btn"
                                    onclick="getMegaReport('${reports_data[i]?.batch_data?.batch_name}','${reports_data[i]?.part_name}', 'inspection')">View</button>
                            </div>
                        </div>
            `

            }
        }
        reports_data_body.innerHTML = html;
        i18n()
        updatePaginationButtons();

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
 * Updates the number of items displayed per page.
 */
function changeItemsPerPage(e) {
    //console.log(e.value)
    filter_payload.limit = parseInt(e.value)
    filter_payload.skip = 0
    getMegaReport();
    updatePaginationButtons();
}


/**
 * Handles pagination to fetch the next set of items.
 */
function onNext() {
    // Calculate the total number of items
    const total_items = reports_count;

    // Increase skip by the limit
    filter_payload.skip += filter_payload.limit;

    // Ensure skip doesn't exceed the total number of items
    if (filter_payload.skip >= total_items) {
        filter_payload.skip = total_items - filter_payload.limit;
    }

    // Fetch data for the current page
    getMegaReport();
    updatePaginationButtons();
}

/**
 * Handles pagination to fetch the previous set of items.
 */
function onPrev() {
    // Decrease skip by the limit
    filter_payload.skip -= filter_payload.limit;

    // Ensure skip doesn't go below 0
    if (filter_payload.skip < 0) {
        filter_payload.skip = 0;
    }

    // Fetch data for the current page
    getMegaReport();
    updatePaginationButtons();
}

/**
 * Updates the display of pagination buttons based on the current page and total items.
 */
function updatePaginationButtons() {
    // Calculate the total number of items
    const total_items = reports_count
    //console.log("first", reports_data.length)
    // Disable or enable the "Next" and "Previous" buttons based on the current page
    const next_button = document.getElementById('nextButton'); // Update with your button IDs
    const prev_button = document.getElementById('prevButton'); // Update with your button IDs
    const pagination_count = document.getElementById('pagination-count'); // Update with your div ID

    if (filter_payload.skip + filter_payload.limit >= total_items) {
        next_button.style.display = 'none'; // Disable "Next" button on the last page
    } else {
        next_button.style.display = 'block';
    }

    if (filter_payload.skip === 0) {
        prev_button.style.display = 'none'; // Disable "Previous" button on the first page
    } else {
        prev_button.style.display = 'block';
    }
    // Calculate the current report data range
    const current_start = filter_payload.skip + 1;
    const current_end = Math.min(filter_payload.skip + filter_payload.limit, total_items);

    // Display the current report data range and total number of items in your HTML
    pagination_count.textContent = `${current_start} - ${current_end} of ${total_items}`;

}

const sync_button = document.getElementById("sync_button")
const loader = document.getElementById("loader")
const sync_button_container = document.getElementById("sync_button_container")

/**
 * Refreshes the report by initiating a sync operation and handling success or error responses.
 */
function refreshReport() {
    showToast("success", 'Syncing started successfully')
    sync_button.classList.add("d-none")
    sync_button_container.classList.add("d-none")
    loader.classList.remove("d-none")
    get('/is_sync', (result, msg) => {
        if (msg) {
            showToast("danger", msg)
        } else {
            //showToast("success", 'Operation Successfull')
        }
        //window.livisapi.livisShowNotification('Sync Successfull')
        loader.classList.add("d-none")
    }, (error, msg) => {
        if (msg) {
            //window.livisapi.livisShowNotification(msg);
            showToast('danger', msg)
        } else {
            //window.livisapi.livisShowNotification(error.message);
            showToast('danger', error.message)
        }
        sync_button.classList.remove("d-none")
        loader.classList.add("d-none")
    })
}


const user = JSON.parse(localStorage.getItem("livis_user_info"))
/**
 * Initializes the view based on user role and loads the report data.
 */
function ngOnInit() {
    const role = user?.role
    if (role == "operator" || role == "admin") {
        sync_button_container.classList.add("d-none")
    } else {
        sync_button_container.classList.remove("d-none")
    }
    setIsLoading(true, 'Please Wait Until we load the reports')
    getMegaReport()

}

ngOnInit()



const livis_reports_modal = new bootstrap.Modal(document.getElementById("livis-reports-modal"))
const livis_reports_modal_ref = document.getElementById("livis-reports-modal-ref")
// livis_reports_modal.show()search

/**
 * Toggles the fullscreen mode of the reports modal.
 */
function fullSizeReportsModal() {
    livis_reports_modal_ref.classList.toggle("modal-fullscreen")
}
const livis_reports_imageGallery_modal = new bootstrap.Modal(document.getElementById("livis-reports-acceptance-modal"))
const livis_reports_imageGallery_modal_ref = document.getElementById("livis-reports-image-gallery-modal-ref")

/**
 * Toggles the fullscreen mode of the image gallery modal.
 */
function fullSizeImageGalleryModal() {
    livis_reports_imageGallery_modal_ref.classList.toggle('modal-fullscreen')
}

/**
 * Closes the reports modal.
 */
function closeReportsModal() {
    livis_reports_modal.hide()
}

/**
 * Closes the image modal.
 */
function closeReportsImageModal() {
    image_modal.hide()
}

var request_options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json', // Set the content type to JSON
        // Add any other headers you need here
    },
};

/**
 * Sends a request to verify the report and updates the report data.
 */
function verifyReport(input, id) {
    //console.log(input);
    request_options.body = JSON.stringify({
        doc_id: id,
        verification_status: input,
        verified_by: user.user_name
    })
    fetch(BASE_URL + '/alter_reports_verification_flag', request_options).then((response) => {
        // Check if the response status is OK (200)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Parse the response body as JSON
        return response.json();
    })
        .then((data) => {
            getMegaReport()
            // const batch_id = batches?.find(item => item?.batch_name == payload?.batch_name)?._id
        })
        .catch((error) => {
            // Handle any errors that occurred during the fetch
            console.error('Fetch error:', error);
            //console.log("Came here in catch")

        });
}

/**
 * Displays the details of a single report in a modal.
 */
function showReportsModal(value) {
    const data = reports_data[value]
    single_report_data = value
    // //console.log(data)
    livis_reports_modal.show()
    const single_report_body = document.getElementById("single-report-body")
    const single_report_created_at = document.getElementById("single-report-created-at")

    single_report_created_at.innerHTML = `${formatDateTime(data?.inspected_datetime)}`
    i18n()
    let single_report_HTML = ``
    single_report_HTML += `
                        <div class="row w-100 h-100 p-0 m-0" >
                            <div
                                class="col-md-12 d-flex p-0 justify-content-around align-items-center livis-reports-modal-upper-card">
                                <div>
                                    <div data-i18n="part_name" class="livis-reports-title">Part Name</div>
                                    <div class="livis-reports-info">${data?.part_name ? data?.part_name : '--'}</div>
                                </div>
                                <div>
                                    <div data-i18n="part_number" class="livis-reports-title">Part Number</div>
                                    <div class="livis-reports-info">${data?.part_number ? data?.part_number : '--'}</div>
                                </div>
                                <div>
                                    <div data-i18n="batch_no" class="livis-reports-title">Batch No</div>
                                    <div class="livis-reports-info">${data?.batch_data?.batch_name ? data?.batch_data?.batch_name : '--'}</div>
                                </div>
                                <div>
                                    <div data-i18n="batch_size" class="livis-reports-title">Batch Size</div>
                                    <div class="livis-reports-info">${data?.batch_data?.batch_size == 999999 ? 'MAX' : data.batch_data.batch_size}</div>
                                </div>
                                <div>
                                    <div data-i18n="station_name" class="livis-reports-title">Station Name</div>
                                    <div class="livis-reports-info">${data?.workstation_name ? data?.workstation_name : '--'}</div>
                                </div>
                                <div>
                                    <div data-i18n="station_type" class="livis-reports-title">Station Type</div>
                                    <div class="livis-reports-info">${data?.workstation_type ? data?.workstation_type : '--'}</div>
                                </div>
                                <div class="livis-human-verification-block">
                                    <div class="livis-reports-title">Human Verification</div>
                                    <div class="livis-reports-info">
                                        <select id="human-verification" onchange="
                                            verifyReport(event.target.value,'${data?._id}')">
                                            <option value=0>Pass</option>
                                            <option value=1>Fail</option>
                                        </select>   
                                    </div>
                                </div>

                            </div>
                            <!-- <div class="col-md-3 p-0">

                            </div> -->
                            <div class="col-md-9 py-2 d-flex flex-wrap">`
    for (let v = 0; v < data?.recipe_results?.length; v++) {
        single_report_HTML += `
            <div class="border rounded px-2 py-1 mx-2 livis-report-positions ${v === selected_position ? "active" : ""}" onclick="showPositionDetails(${v})">P${v}</div>
        `
    }

    single_report_HTML += `</div>
                            <div class="col-md-3 py-2">

                            </div>
                            <div class="col-md-9 ps-0">`


    // <div class="camera-feed h-100 single-report-feed-wrap">
    //     <img src="${data?.recipe_results[0]?.['P0-M1-C1']?.inferred_image}" width="100%" height="100%" alt="">
    // </div> 
    const carousal_items = [data?.recipe_results[selected_position]]
    //console.log(carousal_items)
    single_report_HTML += `
    <div id="carouselExample" class="carousel slide">
        <div class="carousel-inner">
            <div class="livis-action-wrap position-absolute">
                <span class="ps-2">Hide</span>
                    <label class="switch " >
                        <input type="checkbox" id="inference-switch"${show_inferred_images ? 'checked' : ''} >
                        <span class="slider round"></span>
                    </label>
                <span class="ps-1 pe-1">Show</span>
            </div>
`
    single_report_HTML += createCarasoul(carousal_items)
    if (createCarasoul(carousal_items).split('carousel-item').length - 1 > 1) {
        single_report_HTML += `</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span data-i18n="previous"  class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span data-i18n="next"  class="visually-hidden">Next</span>
            </button>
        </div>
        `
    }
    else
        single_report_HTML += `</div></div>`


    single_report_HTML += `
                                <!-- <div class="livis-mini-feeds-wrap row p-0 m-0">
                                    <div class="col-md-4 ps-0">
                                        <div class="card p-2 position-relative">
                                            <div>
                                                <img src="../common/image/sample.svg" width="100%" alt="sample image">
                                            </div>
                                            <div class="w-100">
                                                <div class="d-flex my-1 livis-reports-title flex-wrap py-2">Defects: &nbsp;
                                                    <span data-i18n="roughness"  class="livis-defect-rejected">Roughness, </span><span data-i18n="scratch"
                                                        class="livis-defect-rejected">Scratch</span>
                                                </div>
                                                <div class="d-flex my-1 livis-reports-title  flex-wrap">Features: &nbsp;
                                                    <span data-i18n="roughness" class="livis-defect-accepted">Roughness</span><span data-i18n="scratch"
                                                        class="livis-defect-accepted">Scratch</span>
                                                </div>
                                            </div>
                                            <div class="position-absolute d-flex livis-mini-feed-status-position-wrap">
                                                <div data-i18n="po" class="livis-mini-feed-position">P0</div>
                                                <div data-i18n="accepted" class="livis-mini-feed-status">Accepted</div>
                                            </div>
                                        </div>
                                    </div> 
                                </div>-->
                            </div>
                            <div class="col-md-3 p-0">
                                <div class="accordion" id="livis-result-accordian">
                                    <div class="livis-inspection-stats-option livis-inspection-report w-100">
                                        <!-- <div class="" id="livis-heading-result">
                                            <button data-i18n="inspection_result" class="accordion-button" type="button" data-bs-toggle="collapse"
                                                data-bs-target="#inspection-result" aria-expanded="falsedd"
                                                aria-controls="inspection-result" id="inspection-result-text">
                                                Inspection Result
                                            </button>
                                        </div> -->
                                        <div id="inspection-result" class="accordion-collapse collapse show"
                                            aria-labelledby="livis-heading-result" data-bs-parent="#livis-result-accordian">
                                            <div class="livis-defect-wrap mx-2 mt-2">
                                                <div
                                                    class="livis-defect-header d-flex justify-content-center align-items-center">
                                                    <p data-i18n="status" >Status</p>
                                                </div>
                                                <div class="text-center py-2 report-modal-status ${data?.overall_acceptance ? "accepted" : "rejected"}">
                                                ${data?.overall_acceptance ? "Accepted" : "Rejected"}
                                                </div>
                                            </div>
                                            <div class="accordion-body livis-collapse-content px-2">
                                                <div class="livis-defect-feature-result">
                                                    <div class="livis-defect-container w-100 mb-2" id="livis-defect-container">
                                                        <div class="livis-defect-wrap m-0" id="livis-defect-wrap">
                                                            <div class="livis-defect-header">
                                                                <p data-i18n="defects" >Defects</p>
                                                            </div>
                                                            <div class="livis-defect-body">`
    if (data.logic_type === 'positionwise') {
        let features = data?.position_results[`P` + selected_position].features
        let defects = data?.position_results[`P` + selected_position].defects
        for (const key in defects) {
            single_report_HTML += `
                                                                    <div class="livis-defect-item" >
                                                                        <p></p>
                                                                        <p>${key.replaceAll('_', ' ')}:${defects[key]}</p>
                                                                    </div>
                                                                `

        }

        single_report_HTML += ` </div>
                                                        </div>
                                                    </div>
                                                    <div class="livis-defect-container w-100" id="livis-feature-container">
                                                        <div class="livis-feture-wrap" id="livis-feture-wrap">
                                                            <div class="livis-feature-header">
                                                                <p data-i18n="feature" >Feature</p>
                                                            </div>
                                                            <div class="livis-feature-body">`
        for (const key in features) {
            single_report_HTML += `
                                                                    <div class="livis-defect-item" >
                                                                        <p></p>
                                                                        <p>${key?.replaceAll('-', ' ')}:${features[key]}</p>
                                                                    </div>
                                                                `

        }
    } else if (data.logic_type == 'partwise' || data.logic_type == 'camerawise') {
        let features = data?.partwise_results.features
        let defects = data?.partwise_results.defects
        for (const key in defects) {
            single_report_HTML += `
                                                                    <div class="livis-defect-item" >
                                                                        <p></p>
                                                                        <p>${key.replaceAll('_', ' ')}:${defects[key]}</p>
                                                                    </div>
                                                                `

        }

        single_report_HTML += ` </div>
                                                        </div>
                                                    </div>
                                                    <div class="livis-defect-container w-100" id="livis-feature-container">
                                                        <div class="livis-feture-wrap" id="livis-feture-wrap">
                                                            <div class="livis-feature-header">
                                                                <p data-i18n="feature" >Feature</p>
                                                            </div>
                                                            <div class="livis-feature-body">`
        for (const key in features) {
            single_report_HTML += `
                                                                    <div class="livis-defect-item" >
                                                                        <p></p>
                                                                        <p>${key?.replaceAll('-', ' ')}:${features[key]}</p>
                                                                    </div>
                                                                `

        }
    }


    single_report_HTML += `  </div>
                                                        </div>
                                                    </div>
                                                    <div class="livis-defect-container w-100 mt-2" id="livis-feature-container">
                                                        <div class="livis-feture-wrap" id="livis-feture-wrap">
                                                            <div class="livis-feature-header">
                                                                <p data-i18n="reject_reasons" >Reject Reasons</p>
                                                            </div>
                                                            <div class="livis-feature-body">`+
        getRejectReasons(data)
        + `</div>
                                                        </div>
                                                    </div>
                                                    <div class="livis-defect-container w-100 mt-2" id="livis-feature-container">
                                                        <div class="livis-feture-wrap" id="livis-feture-wrap">
                                                            <div class="livis-feature-header">
                                                                <p data-i18n="unique_serial_no">Unique Serial No.</p>
                                                            </div>
                                                            <div class="livis-feature-body">
                                                                <div class="livis-defect-item" >
                                                                    <p></p>
                                                                    <p>${data.source_details ? data.source_details : '--'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row m-0">
                                                        <div class="col-md-6 w-45 mt-2 ml-1 livis-defect-item" style="border-style: solid #108234;border-radius: 0.75rem; background-color:#108234">
                                                            <div class="row" id="acceptedImagesButton">
                                                                <div class="col-md-8" >Accepted Images </div>
                                                                <div class="col-md-4">  <text id="accepted-image-count"></text></div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6 justify-content-end w-45 mt-2 livis-defect-item" style="border-style: solid #B50000;border-radius: 0.75rem; background-color:#b50000">
                                                            <div class="row" id="rejectedImagesButton">
                                                                <div class="col-md-8" >Rejected Images</div>
                                                                <div class="col-md-4"> <text id="rejected-image-count"></text></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    `
    //console.log('---', carousal_items);
    single_report_body.innerHTML = single_report_HTML
    calculateImageCount(carousal_items)
    document.getElementById('rejectedImagesButton').addEventListener('click', function () {
        showRejectedImagesModal(carousal_items, false);
    });
    document.getElementById('acceptedImagesButton').addEventListener('click', function () {
        showRejectedImagesModal(carousal_items, true);
    });
    i18n()
    document.getElementById('human-verification').value = data.verification_status
    const inference_switch = document.getElementById('inference-switch')

    inference_switch.addEventListener('change', function () {
        if (this.checked) {
            show_inferred_images = true
            // livis_reports_modal.hide()

            showReportsModal(value)
        } else {
            show_inferred_images = false
            // livis_reports_modal.hide()

            showReportsModal(value)

        }
    });

}
const image_modal = new bootstrap.Modal(document.getElementById('livis-reports-acceptance-modal'))
/**
 * Displays the rejected images modal with a carousel of images.
 */
function showRejectedImagesModal(carousal_items, acceptance) {
    // //console.log(carousal_items);
    document.getElementById('single-report-acceptance-body').innerHTML = createImagecarasoul(carousal_items, acceptance)
    //console.log(carousal_items);
    if (document.getElementById('single-report-acceptance-body').innerHTML != '')
        image_modal.show();
}

/**
 * Creates a carousel of images for the report.
 */
function createImagecarasoul(carousal_items, acceptance) {
    let single_report_HTML = ''
    single_report_HTML += `<div id="carouselExample1" class="carousel slide">
        <div class="carousel-inner">
`
    single_report_HTML += createCarasoulInner(carousal_items, acceptance) + `</div>`
    if (acceptance && parseInt(document.getElementById('accepted-image-count').innerText) >= 1)
        single_report_HTML += `
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample1" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span data-i18n="previous"  class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExample1" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span data-i18n="next"  class="visually-hidden">Next</span>
            </button>
        `
    if (!acceptance && parseInt(document.getElementById('rejected-image-count').innerText) > 1)
        single_report_HTML += `
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExample1" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span data-i18n="previous"  class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExample1" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span data-i18n="next"  class="visually-hidden">Next</span>
            </button>
        `
    return single_report_HTML + `</div>`
}

/**
 * Calculates and updates the count of accepted and rejected images.
 */
function calculateImageCount(carousal_items) {
    var accepted = []
    var rejected = []
    carousal_items?.forEach((dataItem, index) => {
        for (const key in dataItem) {
            if (dataItem.hasOwnProperty(key)) {
                accepted.push(...(dataItem[key].accepted_images))
                rejected.push(...(dataItem[key].rejected_images))
            }
        }
    });
    document.getElementById('accepted-image-count').innerText = accepted.length
    document.getElementById('rejected-image-count').innerText = rejected.length
}

/**
 * Generates the HTML for carousel items based on the provided image data.
 * 
 * @param {Array} carousal_items - Array of objects containing image data.
 * @param {boolean} acceptance - Determines whether to show accepted or rejected images.
 * @returns {string} HTML string for the carousel items.
 */
function createCarasoulInner(carousal_items, acceptance) {
    let single_report_HTML = ''
    // //console.log(carousal_items)
    let inferredImage = []
    carousal_items?.forEach((dataItem, index) => {
        for (const key in dataItem) {
            if (dataItem.hasOwnProperty(key)) {
                inferredImage.push(...(acceptance ? dataItem[key].accepted_images : dataItem[key].rejected_images))
            }
        }
    });
    // //console.log(inferredImage, "inferred images all")
    if (inferredImage?.length != 0 && inferredImage?.length != undefined) {
        //console.log(inferredImage?.length);
        for (let i = 0; i < inferredImage?.length; i++) {
            // //console.log(inferredImage[i], "img")
            single_report_HTML += `
                            <div class="carousel-item ${i == 0 ? 'active' : ""} position-relative">
                                ${inferredImage ?
                    `<img src="${inferredImage[i].inferred}" class="d-block w-100 reports-camera-feed-min-height h-100 bg-dark livis-cursor-pointer" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';" />`
                    : `<div class="livis-camera-not-available">
                                            <img class="livis-no-camera-img" src="../common/image/no_preview_camera.svg"/>
                                            </br></br>
                                            <p>Camera Not Available</p>
                                            <p>Your camera view will be displayed here once connected</p>
                                            </div>`}
                            </div>
                        `;
        }
    }
    else {
        // //console.log('reject accept');
        single_report_HTML += `
                            <div class="carousel-item active position-relative">
                                <div class="livis-camera-not-available" >
                                        </br></br>
                                        <p>Images Not Available</p>
                                </div>
                            </div>
                        `;

    }
    return single_report_HTML
}

/**
 * Creates the HTML for a carousel based on the provided items.
 * 
 * @param {Array} carousal_items - Array of objects containing image data.
 * @returns {string} HTML string for the carousel items.
 */
function createCarasoul(carousal_items) {
    let single_report_HTML = ''
    carousal_items?.forEach((dataItem, index) => {
        for (const key in dataItem) {
            //console.log('image list', dataItem.length);
            if (dataItem.hasOwnProperty(key)) {
                const inferred_image = show_inferred_images ? dataItem[key].inferred_image : dataItem[key].original_image;
                single_report_HTML += `
                        <div class="carousel-item ${key == Object.keys(carousal_items[0])[0] ? 'active' : ""} position-relative">
                            ${inferred_image ?
                        `<img src="${inferred_image}" class="d-block w-100 reports-camera-feed-min-height h-100 bg-dark livis-cursor-pointer" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';" onclick="showFeedInFullScreen('${inferred_image}')" />`
                        : `<div class="livis-camera-not-available">
                                        <img class="livis-no-camera-img" src="../common/image/no_preview_camera.svg"/>
                                        </br></br>
                                        <p>Camera Not Available</p>
                                        <p>Your camera view will be displayed here once connected</p>
                                        </div>`}
                            <div class="position-absolute livis-position-result-wrap d-flex">
                                <div class="position-wrap livis-reports-posiiton-wrap">${key.replaceAll("-", " ")}</div>
                                <div class="livis-reports-status-wrap ${dataItem[key]?.is_accepted ? 'status-accepted' : 'status-rejected'}">${dataItem[key]?.is_accepted ? 'Accepted' : 'Rejected'}</div>
                                   ${dataItem[key]?.source_name ? `<div class="position-status livis-reports-posiiton-wrap">${dataItem[key]?.source_name}</div>` : ``}
                            </div>
                        </div>
                    `;
            }
        }
    });
    return single_report_HTML
}

/**
 * Generates the HTML for displaying rejection reasons based on the provided results.
 * 
 * @param {Object} results - Object containing rejection reasons and logic type.
 * @returns {string} HTML string for the rejection reasons.
 */
function getRejectReasons(results) {
    let reasons_HTML = ``
    //console.log(results)
    const camera_wise_reject_reasons = [results?.recipe_results?.[selected_position]]
    const part_wise_reject_reasons = [results.partwise_results]
    const position_wise_reject_reasons = [results?.position_results]
    let reject_reasons
    switch (results?.logic_type) {
        case 'partwise':
            reject_reasons = part_wise_reject_reasons
            break;
        case 'positionwise':
            reject_reasons = position_wise_reject_reasons
            break;
        default:
            reject_reasons = camera_wise_reject_reasons
    }
    //console.log(reject_reasons);
    reject_reasons?.forEach((dataItem, index) => {
        for (const key in dataItem) {
            if (dataItem.hasOwnProperty(key)) {
                //console.log(dataItem, index, dataItem[key], key, dataItem[key]?.reject_reason)
                reasons_HTML +=
                    `
                            <div class="livis-defect-item my-3">
                                <p>${key}</p>
                                <p>${dataItem[key] ? (function () {
                        let temp = ''
                        if (results?.logic_type === 'partwise')
                            temp += getRejectReasonHtml(results?.partwise_results.reject_reason)
                        else if (results?.logic_type === 'positionwise')
                            temp += getRejectReasonHtml(results?.position_results['P' + selected_position]?.reject_reason)
                        else
                            temp += getRejectReasonHtml(dataItem[key]?.reject_reason)


                        if (dataItem[key]?.bar_text) {
                            if (dataItem[key]?.bar_text.length > 0) {
                                for (const i in dataItem[key]?.bar_text) {
                                    temp += `<ul>${dataItem[key]?.bar_text[i].replaceAll('_', " ")}</ul>`
                                }
                            } else {
                                temp += '--'
                            }
                        }
                        if (dataItem[key]?.ocr_text) {
                            if (dataItem[key]?.ocr_text.length > 0) {
                                for (const i in dataItem[key]?.ocr_text) {
                                    temp += `<ul>${dataItem[key]?.ocr_text[i].replaceAll('_', " ")}</ul>`
                                }
                            }
                            else
                                temp += '--'

                        }
                        if (dataItem[key]?.peripheral_device_data) {
                            //console.log('---pd----');
                            temp += `<ul>${dataItem[key]?.peripheral_device_data.replaceAll('_', " ")}</ul>`
                        }
                        return temp;
                    })() : "--"}</p>
                            </div>`

            }
        }
    })

    return reasons_HTML
}

/**
 * Generates the HTML for rejection reasons.
 * 
 * @param {Array} rejectReason - Array of rejection reasons.
 * @returns {string} HTML string for the rejection reasons.
 */
function getRejectReasonHtml(rejectReason) {
    let html = ''
    if (rejectReason) {
        for (const i in rejectReason) {
            html += `<ul>${rejectReason[i].replaceAll('_', " ")}</ul>`
        }
    }
    return html != '' ? html : '--'
}

/**
 * Placeholder function for exporting data to a PDF.
 */
function exportPDF() {

}

/**
 * Updates the selected position and displays the report modal.
 * 
 * @param {string} value - The value representing the selected position.
 */
function showPositionDetails(value) {
    //console.log(value)
    selected_position = value
    showReportsModal(single_report_data)
}
