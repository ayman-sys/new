// declared global variable to keep the configurations ready 
var operatorPanelConfiguration = {}
var total_feeds = 0
var feeds_per_screen = 0
var current_page = 1
var feeds = {}
var selectedCameraModel = ""
var selectedCameraPosition = ""
var view_type = 'normal'
var start = 0
var end = 0
var healtch_check_type = "hardware"
var timerInterval
var selectedPosition = 0
var hardware_status = true


var inspect_frequency_setinterval_id
var inspect_frequency

const retry_inspect = document.getElementById("retry-inspect")

const waypoints_wrap = document.getElementById("waypoints-wrap")

const calibration_status_modal = new bootstrap.Modal(document.getElementById('calibration-status-modal'))

const end_process = document.getElementById("end-process")

//function to get the operator panel configuration
async function getOperatorPanelConfiguration() {
  setIsLoading(true, 'Please Wait Until the setup is ready')
  // alert("yes")
  const operator_layout_id = await JSON.parse(localStorage.getItem('deployed_recipe'))
  //////////console.log(operator_layout_id)
  if (operator_layout_id) {
    const urlParams = new URLSearchParams(window.location.search);
    const calibration_state = urlParams.get('calibration_state')
    console.log(calibration_state);
    get('/get_operator_layout_details/' + operator_layout_id?.operator_layout_id, (result, msg) => {

      operatorPanelConfiguration = result?.data?.data?.layout_components_info?.config_component_json
      //////////console.log(result?.data?.data?.data?.layout_components_info?.config_component_json)
      // ////////////console.log('JSON data:', operatorPanelConfiguration);
      this.partInformationConfigure(operatorPanelConfiguration?.part_information)
      this.cameraFeedConfigure(operatorPanelConfiguration?.camera_feed)
      this.startProcessConfigure(operatorPanelConfiguration?.start_process)
      this.endProcessConfigure(operatorPanelConfiguration?.end_process)
      this.inspectConfigure(operatorPanelConfiguration?.inspect)
      this.inspectionStatusConfigure(operatorPanelConfiguration?.inspection_status)
      this.inspectionResultConfigure(operatorPanelConfiguration?.inspection_result)
      this.inspectionCountConfigure(operatorPanelConfiguration?.inspection_count)
      this.inspectionHistoryConfigure(operatorPanelConfiguration?.inspection_history)
      this.companyLogoConfigure(operatorPanelConfiguration?.company_logo)
      this.productionPlanConfigure(operatorPanelConfiguration?.production_plan)
      this.thresholdConfigure(operatorPanelConfiguration?.threshold)
      this.healthCheckConfigure(operatorPanelConfiguration?.health_check)
      ngOnInit()
    }, (error, msg) => {
      if (msg) {
        //window.livisapi.livisShowNotification(msg);
        showToast('danger', msg)
      } else {
        //window.livisapi.livisShowNotification(error.message);
        showToast('danger', error.message)
      }
    })
  } else {
    // getOperatorPanelConfiguration()
    window.location.href = '../home/home.html'
  }

}

// Get reference to the Auto batching switch
const autoBatchingSwitch = document.getElementById('toggleSwitch');

// Get reference to the Auto Sizing switch
const autoSizingSwitch = document.getElementById('auto_batching_size');

const autoInspectSwitch = document.getElementById('auto_inspect_button')

const calibrationModeSwitch = document.getElementById('calibration-status-switch')

const inspection_interval = document.getElementById("inspection_interval")

const start_inspect_box = document.getElementById('start_inspect_box')

const stop_inspect_box = document.getElementById('stop_inspect_box')

const inspect_box = document.getElementById('inspect_box')

inspection_interval.disabled = true

const form = document.getElementById("threshold-form")
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  console.log(formData);
  let temp = {}
  let obj = {}
  for (const [name, value] of formData.entries()) {
    console.log(name, value);
    const ModelClass = name.split('|-|')
    console.log(ModelClass);
    temp[ModelClass[1]] = value / 100
    // obj[ModelClass[0]] = temp
    if (obj.hasOwnProperty(ModelClass[0])) {
      // key exists, add object to the existing key
      if (!Array.isArray(obj[ModelClass[0]])) {
        obj[ModelClass[0]] = obj[ModelClass[0]]; // convert single value to an array
      }
      // obj[ModelClass[0]].newProperty = (temp);
      obj[ModelClass[0]] = { ...obj[ModelClass[0]], ...temp };

    } else {
      // key does not exist, create a new key and add object to it
      obj[ModelClass[0]] = temp;
    }
    temp = {}

  }
  console.log(obj)
  let payload = {}
  const part_name = localStorage.getItem('current_part_name')
  payload[part_name] = obj

  requestOptions.body = JSON.stringify({ usecase_threshold: payload })
  // fetch(BASE_URL + '/set_feature_defect_confidence_score', requestOptions).then((response) => {
  //   // Check if the response status is OK (200)
  //   if (!response.ok) {
  //     throw new Error('Network response was not ok');
  //   }
  //   // Parse the response body as JSON
  //   return response.json();
  // })
  //   .then((data) => {
  //     threshold_modal.hide()
  //     showToast('success', 'Threshold Updated')
  //     //////////console.log("Came here in try")

  //   })
  //   .catch((error) => {
  //     // Handle any errors that occurred during the fetch
  //     console.error('Fetch error:', error);
  //     //////////console.log("Came here in catch")

  //   });
  post('/set_feature_defect_confidence_score', { usecase_threshold: payload }, async (result, msg) => {
    threshold_modal.hide()
    showToast('success', 'Threshold Updated')
  }, async (err, msg) => {
    console.error('Fetch error:', error);
  })

});


// Add Event Listner to toggle switch for calibration
calibrationModeSwitch.addEventListener('change', function () {
  console.log(end_process)
  if (this.checked && end_process.classList.contains('d-none')) {
    console.log('./calibration/calibration.html');
    window.location.href = '../calibration/calibration.html'
  }
  else {
    showToast('warning', 'Please End Current Process to start Calibration')
    this.checked = false

  }
  // window.location.href = './operator/operator.html'

})


// Add event listener to the toggle switch
autoSizingSwitch.addEventListener('change', function () {
  const batch_size = document.getElementById("batch_size")
  if (this.checked) {
    batch_size.value = null
    batch_size.placeholder = "Using Default Batch Size"
    // console.log("setting size 99999", autoSizingSwitch.checked);
    batch_size.disabled = true
    // Do something when switch is on
  } else {
    batch_size.value = 1
    batch_size.placeholder = "Batch Size"
    // console.log("Setting size 1", autoSizingSwitch.checked);
    batch_size.disabled = false

    // Do something when switch is off
  }
});

// Add event listener to the toggle switch
autoBatchingSwitch.addEventListener('change', function () {
  const batch_id = document.getElementById("batch_id")
  if (this.checked) {
    batch_id.placeholder = "Batch Prefix for Auto Batching"
    // console.log("logging prefix");
    // Do something when switch is on
  } else {
    batch_id.placeholder = "Batch No"
    // console.log("logging Batch no");

    // Do something when switch is off
  }
});

// Add event listener to the toggle switch
autoInspectSwitch.addEventListener('change', function () {
  const inspection_interval = document.getElementById("inspection_interval")
  if (this.checked) {
    inspection_interval.value = 1000
    inspection_interval.disabled = false
    // Do something when switch is on
  } else {
    inspection_interval.value = null
    inspection_interval.placeholder = "Toggle Switch to give Inspect Interval"
    inspection_interval.disabled = true
    // Do something when switch is off
  }
});


// shortcut key listener function
document.addEventListener('keydown', function (event) {
  if (event.ctrlKey && event.key === 'i' && !inspect_btn.disabled) {
    inspect()
    inspect_btn.disabled = true
    end_process.disabled = true
    retry_inspect.disabled = true
    inspect_btn.innerText = 'Inspecting ...'
    retry_inspect.innerText = 'Retry '
  }
  if (event.ctrlKey && event.key === 'k' && !end_process.disabled && !end_process.classList.contains('d-none')) {
    console.log();
    end_process_btn.click()
  }

});

//called at first to retrieve the configuration
getOperatorPanelConfiguration()


//function used to configure the set the part configuration
function partInformationConfigure(data) {
  //get DOM element 
  const part_name = document.getElementById("part-name")
  const part_number = document.getElementById("part-number")
  const unique_serial_no = document.getElementById('unique-serial-number')
  //check if data doesnot exists
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    part_name.classList.add('d-none')
    part_number.classList.add('d-none')
    return
  }

  //check if component is disabled
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    part_name.classList.add('d-none')
    part_number.classList.add('d-none')
    return
  }

  //if part name in the JSON is true
  if (data?.part_name) {
    part_name.classList.remove('d-none')
    // part_name.textContent = 'Sample Part Name'
  }

  //if part number in the JSON is true
  if (data?.part_number) {
    part_number.classList.remove('d-none')
    part_number.textContent = 'XXX'
  }

  if (data?.unique_serial_no) {
    unique_serial_no.classList.remove('d-none')
    source_details.textContent = 'XXXXX'
  }
  else {
    unique_serial_no.classList.add('d-none')
  }

}

//function used to configure the set the camera feed configuration
function cameraFeedConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  //get the feeds configuration
  total_feeds = parseInt(data?.total_number_of_feeds)
  feeds_per_screen = parseInt(data?.number_of_feeds_in_one_screen)
  end = feeds_per_screen
  let html = ''
  // ////////////console.log(total_feeds, feeds_per_screen)
  console.log(data);
  //get the DOM element
  const camera_feed = document.getElementById("camera-feed")

  //append number of feeds
  for (let i = 0; i < feeds_per_screen; i++) {
    html += `
        <div class="operator-panel-feed operator-panel-feed-${feeds_per_screen === 3 ? 4 : feeds_per_screen}"><img src="../common/image/no_preview.svg" /></div>
    `;
  }
  if (feeds_per_screen == 3) {
    html += `
        <div class="operator-panel-feed operator-panel-feed-4"></div>
    `;
  }

  camera_feed.innerHTML = html
  createPagination(total_feeds, feeds_per_screen)

}

//function used to configure the set the start process configuration
function startProcessConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const start_process = document.getElementById("start-process")
  start_process.textContent = data.display_text.substr(0, 15)
  if (data?.start_process_type == "start_using_plc") {
    startProcessEvent?.close()
    startProcessSSE()
  }
  if (data?.process_initiation_type === 'enter_part_details_to_start') {
    const batch_id = document.getElementById("batch_id")
    const batch_size = document.getElementById("batch_size")
    const part_name = document.getElementById("part_name")
    const remarks = document.getElementById("remarks")
    if (data?.batch_id) {
      batch_id.classList.remove("d-none")
    } else {
      batch_id.classList.add("d-none")
    }

    if (data?.batch_size) {
      batch_size.classList.remove("d-none")
    } else {
      batch_size.classList.add("d-none")
    }

    if (data?.part_name) {
      part_name.classList.remove("d-none")
    } else {
      part_name.classList.add("d-none")
    }

    if (data?.remarks) {
      remarks.classList.remove("d-none")
    } else {
      remarks.classList.add("d-none")
    }

    if (data?.auto_batching) {
      autoBatchingSwitch.click()
    }

    if (data?.set_max_batch) {
      autoSizingSwitch.click()
    }
  }
  // ////////////console.log(data)
}

//function used to configure the set the end process configuration
function endProcessConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const end_process = document.getElementById("end-process")
  end_process.textContent = data.display_text.substr(0, 15)
  // ////////////console.log(data)
}
//function used to configure the set the inspect configuration
function inspectConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const inspect = document.getElementById("inspect")
  inspect.textContent = data.display_text.substr(0, 15)
  if (data?.interval_rate) {
    autoInspectSwitch.checked = true
    inspection_interval.value = data?.interval_rate * 1000
  }
  // ////////////console.log(data)
}

let accepted_status_manual_override
let rejected_status_manual_override
//function used to configure the set the inspection status configuration
function inspectionStatusConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  accepted_status_manual_override = data?.accepted_parts_details?.is_manual_overide_enabled
  rejected_status_manual_override = data?.rejected_parts_details?.is_manual_overide_enabled
  if (!accepted_status_manual_override && !rejected_status_manual_override)
    document.getElementById('livis-manual-override').classList.add('d-none')
  else
    document.getElementById('livis-manual-override').classList.remove('d-none')

  // ////////////console.log(data)
}
//function used to configure the set the inspection result configuration
function inspectionResultConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const inspection_result_accordian_wrap = document.getElementById("inspection-result-accordian-wrap")
  const inspection_result = document.getElementById("inspection-result-text")
  const inspection_result_defects = document.getElementById("livis-defect-wrap")
  const inspection_result_features = document.getElementById("livis-feture-wrap")
  const livis_defect_container = document.getElementById("livis-defect-container")
  const livis_feature_container = document.getElementById("livis-feature-container")
  const inspection_result_ocr = document.getElementById("livis-ocr-wrap")
  const inspection_result_barcode = document.getElementById("livis-barcode-wrap")
  const inspection_result_pd = document.getElementById("livis-pd-wrap")
  inspection_result_accordian_wrap.classList.remove('d-none')
  inspection_result.textContent = data.display_text.substr(0, 25)
  // inspection_result.remove
  if (data?.display_features) {
    inspection_result_features.classList.remove('d-none')
  } else {
    inspection_result_features.classList.add('d-none')
    inspection_result_defects.style.minWidth = '100%'
    livis_defect_container.style.minWidth = '100%'
  }
  if (data?.display_defects) {
    inspection_result_defects.classList.remove('d-none')
  } else {
    inspection_result_defects.classList.add('d-none')
    inspection_result_features.style.minWidth = '100%'
    livis_feature_container.style.minWidth = '100%'
  }
  if (data?.display_ocr) {
    inspection_result_ocr.classList.remove('d-none')
  } else {
    inspection_result_ocr.classList.add('d-none')
  }
  if (data?.display_barcod) {
    inspection_result_barcode.classList.remove('d-none')
  } else {
    inspection_result_barcode.classList.add('d-none')
  }
  if (data?.display_pd) {
    inspection_result_pd.classList.remove('d-none')
  } else {
    inspection_result_pd.classList.add('d-none')
  }
  // ////////////console.log(data)
}
//function used to configure the set the inspection count configuration
function inspectionCountConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const inspection_count = document.getElementById("inspection-count")
  inspection_count.textContent = data.display_text.substr(0, 25)


  const accepted_count = document.getElementById('livis-inspect-accept')
  const rejected_count = document.getElementById('livis-inspect-reject')
  const aborted_count = document.getElementById('livis-inspect-abort')
  const total_count = document.getElementById('livis-inspect-total')
  const avg_cycle_time = document.getElementById('livis-cycle-time-wrap')
  const yield_pass = document.getElementById('livis-yield-pass-wrap')
  //////////console.log(data)
  if (data?.enable_accepted_count) {
    accepted_count.classList.remove('d-none')
  } else {
    accepted_count.classList.add('d-none')
    rejected_count.style.minWidth = '100%'
  }
  if (data?.enable_rejected_count) {
    rejected_count.classList.remove('d-none')
  } else {
    rejected_count.classList.add('d-none')
    accepted_count.style.minWidth = '100%'
  }
  if (data?.enable_aborted_count) {
    aborted_count.classList.remove('d-none')
  } else {
    aborted_count.classList.add('d-none')
  }
  if (data?.enable_total_count) {
    total_count.classList.remove('d-none')
  } else {
    total_count.classList.add('d-none')
  }
  if (data?.enable_first_time_yeild_pass) {
    yield_pass.classList.remove('d-none')
  } else {
    yield_pass.classList.add('d-none')
  }
  if (data?.enable_average_cycle_time) {
    avg_cycle_time.classList.remove('d-none')
  } else {
    avg_cycle_time.classList.add('d-none')
  }

}
//function used to configure the set the inspection history configuration
function inspectionHistoryConfigure(data) {
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    return
  }
  const inspection_history = document.getElementById("inspection-history")
  inspection_history.textContent = data.display_text.substr(0, 25)
  const past_5 = document.getElementById("livis-past5-inspections")
  // if (data?.enable_past_five_inspection_results) {
  //     past_5.classList.remove('d-none')
  // } else {
  //     past_5.classList.add('d-none')
  // }
  // ////////////console.log(data)
}
//function used to configure the set the company logo configuration
function companyLogoConfigure(data) {
  if (!data) {
    return
  }
  if (!data.enable_component) {
    return
  }
  const company_logo = document.getElementById("company-logo")
  if (data.enable_component && data.dataURL?.length == 0) {
    company_logo.src = '../common/image/livis-logo.svg'
  } else {
    company_logo.src = data.dataURL ? data.dataURL : '../common/image/livis-logo.svg'
  }
}

//function used to configure the set the production plan configuration
function productionPlanConfigure(data) {
  const livis_opertor_batch = document.getElementById("livis-opertor-batch")
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    livis_opertor_batch.classList.add('d-none')
    return
  }
  livis_opertor_batch.classList.remove('d-none')


  const batch_id = document.getElementById('livis-batch-id')
  const batch_size = document.getElementById('livis-batch-size')
  const current_batch_size = document.getElementById('livis-current-batch-size')
  if (data?.batch_id) {
    batch_id.classList.remove('d-none')
  } else {
    batch_id.classList.add('d-none')

  }
  if (data?.batch_size) {
    batch_size.classList.remove('d-none')

  } else {
    batch_size.classList.add('d-none')

  }
  if (data?.current_batch_size) {
    current_batch_size.classList.remove('d-none')

  } else {
    current_batch_size.classList.add('d-none')
  }
}
//function used to configure the set the threshold configuration
function thresholdConfigure(data) {
  // if (!document.getElementById("threshold-menu")) return
  const threshold = document.getElementById("threshold-menu")
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (false) {
    threshold.classList.add('d-none')
    return
  } else {
    threshold.classList.remove('d-none')
  }
}
//function used to configure the set the health check configuration
function healthCheckConfigure(data) {
  const health_check = document.getElementById("health-check")
  const livis_health_hardware_btn = document.getElementById("livis-health-hardware-btn")
  const livis_health_software_btn = document.getElementById("livis-health-software-btn")
  const livis_health_hardware_list = document.getElementById("livis-health-hardware-list")
  const livis_health_software_list = document.getElementById("livis-health-software-list")
  if (!data) {
    // ////////////console.log("DATA NOT AVAILABLE")
    return
  }
  if (!data.enable_component || (!data?.hardware_health_check && !data?.software_health_check)) {
    // ////////////console.log("COMPONENT NOT ENABLED")
    health_check.classList.add('d-none')
    return
  }
  // ////////////console.log(data)
  health_check.classList.remove('d-none')

  if (data?.hardware_health_check) {
    livis_health_hardware_btn.classList.remove('d-none')
  } else {
    livis_health_hardware_btn.classList.add('d-none')
    livis_health_software_btn.classList.add("active-health-check-btn")
    livis_health_software_list.classList.remove("d-none")
    livis_health_hardware_list.classList.add("d-none")
  }
  if (data?.software_health_check) {
    livis_health_software_btn.classList.remove('d-none')
  } else {
    livis_health_software_btn.classList.add('d-none')
  }
}



/* The code provided is a comment section in JavaScript. It appears to be describing the logic for
camera feed pagination, but there is no actual code or logic implementation present in the comment.
It seems to be a placeholder for where the logic for camera feed pagination could be written. */
//Logic for camera feed pagination
const operator_panel_feed_pagination_right = document.getElementById("operator-panel-feed-pagination-right")
const operator_panel_feed_pagination_left = document.getElementById("operator-panel-feed-pagination-left")

operator_panel_feed_pagination_left.addEventListener('click', cameraFeedPaginationPrev)
operator_panel_feed_pagination_right.addEventListener('click', cameraFeedPaginationNext)


/**
 * The function `createPagination` handles the pagination logic for camera feeds based on the total
 * number of feeds and feeds displayed per screen.
 * @param total_feeds - Total number of camera feeds available.
 * @param feeds_per_screen - The `feeds_per_screen` parameter represents the number of camera feeds
 * that are displayed on the screen at once. This value is used in the `createPagination` function to
 * determine how many camera feeds are shown per screen and to calculate the total number of pages
 * needed for pagination based on the total number of
 */
function createPagination(total_feeds, feeds_per_screen) {
  //pagination logic
  const camera_feed_pagination = document.getElementById("camera-feed-pagination")
  const camera_feed_pagination_left = document.getElementById("operator-panel-feed-pagination-left")
  const camera_feed_pagination_right = document.getElementById("operator-panel-feed-pagination-right")
  if (total_feeds <= 4 && feeds_per_screen >= 4) {
    camera_feed_pagination.classList.add('d-none')
    camera_feed_pagination_left.classList.add('d-none')
    camera_feed_pagination_right.classList.add('d-none')
  } else {
    camera_feed_pagination.classList.remove('d-none')
    camera_feed_pagination_left.classList.remove('d-none')
    camera_feed_pagination_right.classList.remove('d-none')
  }
  if (total_feeds === 1) {
    camera_feed_pagination.classList.add('d-none')
    camera_feed_pagination_left.classList.add('d-none')
    camera_feed_pagination_right.classList.add('d-none')
  }
  camera_feed_pagination.innerHTML = `<span id="current-page">${current_page}</span> / ${Math.ceil(total_feeds / feeds_per_screen) || 1}`
}

/**
 * The function `cameraFeedPaginationNext` increments the current page number and updates the displayed
 * feeds accordingly.
 * @returns If the condition `current_page >= (Math.ceil(total_feeds / feeds_per_screen) || 1)` is
 * true, then nothing will be returned as the function will exit early with a `return` statement. If
 * the condition is false, the function will update the `current_page` variable, update the `start` and
 * `end` variables, log the selected index, call the `get
 */
function cameraFeedPaginationNext() {
  // ////////////console.log(total_feeds, feeds_per_screen, operatorPanelConfiguration)
  if (current_page >= (Math.ceil(total_feeds / feeds_per_screen) || 1)) {
    return
  }
  current_page = current_page + 1
  start = end;
  end = start + feeds_per_screen;
  console.log('selected index', selectedPosition);
  getRunningProcess(selectedPosition)
  const current_page_html = document.getElementById("current-page")
  current_page_html.textContent = current_page
}

/**
 * The function `cameraFeedPaginationPrev` is used to navigate to the previous page of a camera feed
 * pagination system.
 * @returns If the `current_page` is less than or equal to 1, the function will return nothing
 * (undefined).
 */
function cameraFeedPaginationPrev() {
  if (current_page <= 1) {
    return
  }
  current_page = current_page - 1
  end = start;
  start = end - feeds_per_screen;
  getRunningProcess(selectedPosition)
  const current_page_html = document.getElementById("current-page")
  current_page_html.textContent = current_page
}

//thresold modal 
const threshold_modal = new bootstrap.Modal(document.getElementById("threshold-modal"));

/**
 * The function `openThresholdModal` checks if a part name is stored in local storage, shows a modal
 * and retrieves class list threshold if the part name exists, otherwise it displays a danger toast
 * message prompting to start the process to set threshold.
 */
function openThresholdModal() {
  const part_name = localStorage.getItem('current_part_name')
  if (part_name) {
    threshold_modal.show()
    getClasslistThreshold(part_name)
  }
  else
    showToast('danger', 'Start Process To Set Threshold')
}

/**
 * The function `createThresholdForm` generates a form based on input data and a mapping object,
 * displaying input values as range sliders with corresponding percentage outputs.
 * @param input - The `input` parameter in the `createThresholdForm` function seems to be an object
 * containing threshold values for different keys and subkeys. It appears to be a nested object
 * structure where each key contains another object with subkeys and their corresponding values.
 * @param map - The `map` parameter in the `createThresholdForm` function seems to be an object that
 * likely contains key-value pairs mapping keys to their corresponding labels or descriptions. This
 * mapping is used to display the labels in the generated form.
 * @returns The `createThresholdForm` function returns a string that represents an HTML form with input
 * range elements based on the input object and map provided as arguments. The form is dynamically
 * generated based on the keys and values of the input object.
 */
function createThresholdForm(input, map) {
  let thresholdForm = ``
  console.log(input);
  for (let key in input) {
    thresholdForm += `<div class="row"><div class="col-md-12"><bold style="font-weight:800">${capitalizeFirstLetter(map[key])}</bold></div></div>`
    for (const subKey in input[key]) {
      console.log(input[key][subKey]);
      if (input.hasOwnProperty(key)) {
        thresholdForm += `<div class="row ms-1">
            <div class="col-md-6">${subKey}</div>
            <div class="col-md-6 d-flex">
                 <input type="range" name="${key}|-|${subKey}|-|value" id="${key}|-|${subKey}|-|value" min="0" max="100" step="1" value="${input[key][subKey] * 100}"
                 oninput="this.nextElementSibling.value = this.value + '%'">
                  <output class="threshold-value">${input[key][subKey] * 100}%</output>
            </div>
        </div>`
      }
    }
  }
  return thresholdForm;
}

/**
 * The function `getClasslistThreshold` fetches data related to feature defect confidence score and
 * updates the threshold form on the webpage.
 * @param part_name - The `part_name` parameter is a string that represents the name of a specific part
 * or component. It is used as a key to retrieve data related to that particular part in the
 * `getClasslistThreshold` function.
 */
function getClasslistThreshold(part_name) {
  const threshold_form = document.getElementById('threshold-form')
  post('/get_feature_defect_confidence_score', { part_name: part_name }, async (data, msg) => {
    threshold_form.innerHTML = createThresholdForm(data.data.usecase_threshold, data.data.model_usecase_map)

  }, async (err, msg) => {
    console.error('Fetch error:', error);
  })
}

//harware connectivity modal 
const hardware_connectivity_modal = new bootstrap.Modal(document.getElementById("hardware-connectivity-modal"));

/**
 * The function `openHardwareConnectivityModal` checks for a specific part name in local storage and
 * displays a hardware connectivity modal if found, otherwise it shows a danger toast message.
 * @param list - The `list` parameter in the `openHardwareConnectivityModal` function likely refers to
 * a list of hardware components or devices that need to be checked for connectivity. This list could
 * include items such as sensors, actuators, modules, or any other hardware components that require
 * connectivity verification.
 */
function openHardwareConnectivityModal(list) {
  const part_name = localStorage.getItem('current_part_name')
  if (part_name) {
    hardware_connectivity_modal.show()
    getHardwareConnectivityCheck(list)
  }
  else
    showToast('danger', 'Start Process To Get Hardware Details')
}


function getHardwareConnectivityCheck(input) {
  let failedHardware = ``
  console.log(input);
  for (let key in input) {
    console.log(input[key]);
    if (input.hasOwnProperty(key)) {
      failedHardware += `<div class="row">
            <div class="col-md-5 px-2 fs-6"">${input[key].camera_type ? 'Camera / ' + input[key].camera_type : (input[key].plc_id ? 'PLC / ' + input[key].plc_id : '')}</div>
            <div class="col-md-6 d-flex" style="word-break:break-all">
                ${input[key].camera_address ? input[key].camera_address : input[key].plc_ip_address}
            </div>
        </div>`
    }
  }
  document.getElementById('hardware-connectivity-list').innerHTML = failedHardware
}


//date range picker - inspection summary
const currentDate = new Date();
// Get the day, month, and year components
const day = String(currentDate.getDate()).padStart(2, '0'); // Ensure two digits
const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
const year = currentDate.getFullYear();
// Combine the components in the "dd/mm/yyyy" format
const formattedDate = `${month}/${day}/${year}`;
const date_range_picker = document.getElementById("date-range-picker")
date_range_picker.value = `${formattedDate} - ${formattedDate}`
$(function () {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left'
  }, function (start, end, label) {
  });
});

const workstation_data = JSON.parse(localStorage.getItem("deployed_recipe"))

// operator panel apis 

var requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // Set the content type to JSON
    // Add any other headers you need here
  },
};


//start process
const start_process = document.getElementById("start-process")
start_process.addEventListener('click', startProcessType)
const start_process_form_submit = document.getElementById("start-process-form-submit")
start_process_form_submit.addEventListener('click', () => { startProcess(true) })

var start_process_modal = new bootstrap.Modal(document.getElementById("start-process-modal"));
var update_batch_modal = new bootstrap.Modal(document.getElementById("update-batch-modal"))
var intermediate_summary_modal = new bootstrap.Modal(document.getElementById("intermediate-report-modal"))


var batchDetails = {}
var cameraFeedCount = 1
const part_name = document.getElementById("part-name")
const part_number = document.getElementById("part-number")
const batch_id = document.getElementById('livis-batch-id')
const batch_size = document.getElementById('livis-batch-size')
const current_batch_size = document.getElementById('livis-current-batch-size')
const status_bar = document.getElementById('status-bar')

const accepted_count = document.getElementById('accepted-count')
const rejected_count = document.getElementById('rejected-count')
const aborted_count = document.getElementById('aborted-count')
const current_batch_count = document.getElementById('current-batch-count')
const total_count = document.getElementById('total-count')

// const end_process_btn = document.getElementById("end-process")
const inspect_btn = document.getElementById("inspect")
const start_process_btn = document.getElementById("start-process")
const start_process_wrap = document.getElementById("start-process-wrap")
const camera_feed = document.getElementById('camera-feed')
const camera_model = document.getElementById("camera-model")
const camera_position = document.getElementById("camera-position")

const end_process_summary_overall = document.getElementById("end-process-modal-overall-result")
const end_process_summary_total = document.getElementById("end-process-modal-total-inspection")
const end_process_summary_accepted = document.getElementById("end-process-modal-accepted-count")
const end_process_summary_rejected = document.getElementById("end-process-modal-rejected-count")

const batch_full_summary_overall = document.getElementById("batch-full-modal-overall-result")
const batch_full_summary_total = document.getElementById("batch-full-modal-total-inspection")
const batch_full_summary_accepted = document.getElementById("batch-full-modal-accepted-count")
const batch_full_summary_rejected = document.getElementById("batch-full-modal-rejected-count")
const source_details = document.getElementById('source-details')

/**
 * The function `startProcessType` checks the process initiation type and either shows a form or starts
 * the process accordingly.
 */
function startProcessType() {
  const start_process_details = operatorPanelConfiguration?.start_process

  if (start_process_details?.process_initiation_type === 'enter_part_details_to_start') {
    showStartProcessForm()

  } else {
    startProcess()
  }
}

//for plc 
let startProcessEvent
/**
 * The function `startProcessSSE` sets up a connection to a server-sent events (SSE) endpoint and
 * listens for specific events to trigger further actions.
 */
function startProcessSSE() {
  startProcessEvent = new EventSource(BASE_URL + "/start_process_poll"); // Replace with your server's SSE endpoint URL

  // Add event listeners for different types of events
  startProcessEvent.addEventListener("message", function (event) {
    const data = event?.data ? event?.data : false

    if (data === "True" || data == true) {
      // //console.log(data)
      startProcessEvent.close();
      showStartProcessForm()
    }
  });

  startProcessEvent.addEventListener("open", function (event) {
    // Handle 'open' event (connection established)
    //console.log("SSE Connection is open");
  });

  startProcessEvent.addEventListener("error", function (event) {
    // Handle 'error' event (connection error)
    if (event.target.readyState === EventSource.CLOSED) {
      //////////console.log("SSE Connection was closed");
    } else {
      console.error("SSE Connection error:", event);
    }
  });
}

var position_status
var position_status_array
var count_of_inspections
var current_batch_size_number

/**
 * The `showInspectResult` function in JavaScript handles the display of inspection results, updates UI
 * elements based on the data received, and manages various functionalities related to the inspection
 * process.
 * @param data - The `showInspectResult` function takes in two parameters: `data` and `position_index`.
 * The function first retrieves the `current_batch_id` from the localStorage and then checks if it
 * exists. If the `current_batch_id` does not exist, it sets the loading state to false and clears
 * @param [position_index] - The `position_index` parameter in the `showInspectResult` function is used
 * to specify the index of the position for which the inspection results should be displayed. If no
 * `position_index` is provided, the default value of -1 is used, which typically means that the
 * function will display the results
 * @returns The `showInspectResult` function does not explicitly return any value. It mainly performs a
 * series of operations related to displaying inspection results on a user interface based on the
 * provided data and position index. The function interacts with the DOM elements, updates their
 * content, and handles various UI elements based on the inspection data received.
 */
function showInspectResult(data, position_index = -1) {

  const startedbatch = localStorage.getItem("current_batch_id")

  console.log('Show result data', data)
  console.log('Show result data', position_index)
  if (!startedbatch) {
    setIsLoading(false, 'Please Wait Until the setup is readys')
    clearData()
    return
  }

  part_number.classList.add('d-none')
  if (data?.data?.data?.is_running) {
    startProcessEvent?.close()
    getMegaReport(startedbatch)
    console.log('results')
    localStorage.setItem("is_running", true)
    // metrixInterval = setInterval(getMetrix, 2000)
    // getMetrix()

    end_process_btn.classList.remove('d-none')
    // inspect_btn.classList.remove('d-none')
    end_process_box.classList.remove('d-none')
    inspect_btn.disabled = false
    retry_inspect.disabled = false
    start_process_btn.classList.add('d-none')
    start_process_wrap.classList.add('d-none')
    const response = data?.data?.data

    batchDetails = response?.batch_details
    part_name.innerText = response?.part_name
    batch_id.innerText = batchDetails?.batch_name + " / "
    batch_size.innerText = "of " + (batchDetails?.batch_size == 999999 ? 'MAX' : batchDetails?.batch_size)
    // ////////console.log(current_batch_size, batchDetails['Current batch size'])
    current_batch_size.innerText = response?.count_of_inspections
    current_batch_count.innerText = response?.count_of_inspections
    total_count.innerText = "/ " + (batchDetails?.batch_size == 999999 ? 'MAX' : batchDetails?.batch_size)
    accepted_count.innerText = response?.accepted_count ? response?.accepted_count : 0
    rejected_count.innerText = response?.rejected_count ? response?.rejected_count : 0
    const status = response?.last_result?.inspection_result?.overall_result
    console.log('<:>', response?.last_result?.inspection_result?.source_details);
    source_details.innerText = response?.last_result?.inspection_result?.source_details ? (() => { document.getElementById('unique-serial-number').classList.remove('d-none'); return response?.last_result?.inspection_result?.source_details; })() : (() => { document.getElementById('unique-serial-number').classList.add('d-none'); return '--'; })()


    current_inspection_id = data?.data?.data?.last_result?.inspection_result?._id
    // end_process_summary_total.innerText = response?.accepted_count ? response?.accepted_count : 0 + response?.rejected_count ? response?.rejected_count : 0
    end_process_summary_total.innerText = parseInt(accepted_count.innerText) + parseInt(rejected_count.innerText)
    end_process_summary_accepted.innerText = response?.accepted_count ? response?.accepted_count : 0
    end_process_summary_rejected.innerText = response?.rejected_count ? response?.rejected_count : 0
    position_status = response?.last_result?.inspection_result?.position_status
    position_status_array = position_status?.split("/");
    console.log('<><><><><><><<<><><><><>', position_status);
    count_of_inspections = parseInt(response?.count_of_inspections)
    current_batch_size_number = parseInt(batchDetails?.batch_size)
    if (position_status && position_status_array[0] == position_status_array[1]) {
      if (status) {
        status_bar.innerText = operatorPanelConfiguration?.inspection_status?.accepted_text
        status_bar.classList.add('accepted')
        status_bar.classList.remove('rejected')

        end_process_summary_overall.innerText = status_bar.innerText = operatorPanelConfiguration?.inspection_status?.accepted_text
        end_process_summary_overall.classList.remove('rejected')
        end_process_summary_overall.classList.add('accepted')
        batch_full_summary_overall.innerText = status_bar.innerText = operatorPanelConfiguration?.inspection_status?.accepted_text
        batch_full_summary_overall.classList.add('status-accepted')
        batch_full_summary_overall.classList.remove('status-rejected')
        if (accepted_status_manual_override) {
          const manual_override_btn = document.getElementById('livis-manual-override-btn')
          manual_override_btn.disabled = false
          manual_override_btn.click()
        }
      } else if (!status && status != undefined) {
        status_bar.innerText = status_bar.innerText = operatorPanelConfiguration?.inspection_status?.rejected_text
        status_bar.classList.remove('accepted')
        status_bar.classList.add('rejected')
        end_process_summary_overall.innerText = operatorPanelConfiguration?.inspection_status?.rejected_text
        end_process_summary_overall.classList.remove('accepted')
        end_process_summary_overall.classList.add('rejected')
        batch_full_summary_overall.innerText = operatorPanelConfiguration?.inspection_status?.rejected_text
        batch_full_summary_overall.classList.remove('status-accepted')
        batch_full_summary_overall.classList.add('status-rejected')
        if (rejected_status_manual_override) {
          const manual_override_btn = document.getElementById('livis-manual-override-btn')
          console.log('btn', manual_override_btn);
          manual_override_btn.disabled = false
          manual_override_btn.click()
        }
      }


      // manual_override_btn.disabled = true
      // inspect_btn.disabled = true
      if (parseInt(response?.count_of_inspections) == parseInt(batchDetails?.batch_size) && position_status_array[0] == position_status_array[1]) {
        if (response?.batch_details?.is_auto_batching && data?.data?.data?.is_running) {
          // console.log('batch full showing intermediate report')
          inspectPlcSSE?.close()
          stopInspectionWithFrequncy()
          intermediate_summary_modal.show();
          // Set the target end time (in milliseconds)
          const endTime = new Date().getTime() + 12000; // 10 seconds
          // Update the countdown every second
          timerInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            const remainingTime = endTime - currentTime;
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            const formattedTime = '(' + seconds + ')';
            document.getElementById('continue-button-countdown').innerText = formattedTime;
            if (remainingTime <= 0) {
              clearInterval(timerInterval);
              continueBatch()
            }
          }, 1000);

        }
        else {
          stopInspectionWithFrequncy()
          // update_batch_modal.show()
        }
        setTimeout(() => {
          const update_part_name = document.getElementById("update_part_name")
          const update_batch_id = document.getElementById('update_batch_id')
          const update_batch_size = document.getElementById('update_batch_size')

          update_part_name.value = response?.part_name
          update_batch_id.value = batchDetails?.batch_name
          update_batch_size.value = batchDetails?.batch_size
        }, 500);
        console.log('here');
        const inspect_btn = document.getElementById("inspect")
        // inspect_btn.disabled = true
        // inspect_btn.innerText = 'Inspect'
        retry_inspect.disabled = true
        retry_inspect.innerText = 'Retry ' + `${data.data.data.last_result.inspection_result.retry_count > 0 ? '(' + data.data.data.last_result.inspection_result.retry_count + ')' : ''}`

      }
    }
    else {
      status_bar.innerText = 'INSPECTING...'
      status_bar.classList.remove('accepted')
      status_bar.classList.remove('rejected')
    }

    batch_full_summary_overall.innerText = end_process_summary_overall.innerText
    batch_full_summary_total.innerText = end_process_summary_total.innerText
    batch_full_summary_accepted.innerText = end_process_summary_accepted.innerText
    batch_full_summary_rejected.innerText = end_process_summary_rejected.innerText
    let results
    if (position_index < 0) {
      results = [response?.last_result?.inspection_result?.results[response?.last_result?.inspection_result?.results?.length - 1]]
      selectedPosition = response?.last_result?.inspection_result?.results?.length - 1
    }
    else {
      results = [response?.last_result?.inspection_result?.results[position_index]]
      selectedPosition = position_index
    }
    waypoints_wrap.innerHTML = '<h6 class="d-flex align-items-center" style="color: black;">Positions:</h6>'
    let resetDiv = document.createElement("div")
    resetDiv.className = `livis-capture-position-wrap reset`;
    // resetDiv.textContent = "reset"  // You can customize the content here
    resetDiv.id = 'reset'
    waypoints_wrap.appendChild(resetDiv);
    resetDiv.innerHTML += "<img src='../common/image/reset.svg' alt='reset' width=32>";
    document.getElementById('reset').addEventListener('click', () => { resetInspection(); })
    // console.log("<><>111<><>", position_status_array[1]?.split('P')?.length : 0 > 0 ? position_status_array[1].split('P')[1] : 0);
    const total_positions = position_status_array ? (position_status_array[1].split('P')?.length ? position_status_array[1].split('P')[1] : 0) : 0
    console.log('total positions', total_positions);
    const position_list = response?.last_result?.inspection_result?.executed_position_list
    console.log('position list', position_list);
    for (let i = 0; i <= total_positions; i++) {
      let newDiv = document.createElement("div");
      newDiv.className = `livis-capture-position-wrap ${((i) == selectedPosition) ? 'active' : ''}`;
      newDiv.textContent = 'P' + i;  // You can customize the content here
      newDiv.id = 'P' + i
      document.getElementById('reset').insertAdjacentElement("beforebegin", newDiv);
      // document.getElementById(position_list[i]).addEventListener('click', () => { current_page = 1; start = 0; end = feeds_per_screen; showInspectResult(data, i); })
    }



    for (let i = 0; i < position_list?.length; i++) {
      console.log(document.getElementById(position_list[i]));
      console.log('position accept', response?.last_result?.inspection_result?.positionwise_results[position_list[i]].is_accepted);
      if (response?.last_result?.inspection_result?.positionwise_results[position_list[i]].is_accepted)
        document.getElementById(position_list[i]).style.backgroundColor = '#114823'
      else
        document.getElementById(position_list[i]).style.backgroundColor = '#B50000 '
      document.getElementById(position_list[i]).addEventListener('click', () => { current_page = 1; start = 0; end = feeds_per_screen; showInspectResult(data, i); })
    }
    retry_inspect.innerText = 'Retry ' + `${data?.data?.data?.last_result?.inspection_result?.retry_count > 0 ? '(' + data.data.data.last_result.inspection_result.retry_count + ')' : ''}`

    let feedHTML = ``
    let ocr = ''
    let bar = ''
    let pd = ''
    if (results.length && response?.last_result?.inspection_result?.results) {
      //for filtering the camera based on models and positions - similar to part create in v2
      // getCameraFeed()
      console.log(view_type)
      if (view_type == 'normal') {
        //to be eliminated in future
        waypoints_wrap.classList.remove('invisible')
        camera_feed.style.height = '100%'
        console.log('results----', results);
        console.log('selected position----', selectedPosition);
        total_feeds = Object.keys(results[0])?.length ? Object.keys(results[0])?.length : total_feeds
        console.log('total feeds', total_feeds, Object.keys(results[0]));
        createPagination(total_feeds, feeds_per_screen)

        let count = 0
        results?.forEach((dataItem, index) => {
          for (const [index, key] of Object.keys(dataItem).entries()) {
            if (dataItem.hasOwnProperty(key)) {
              console.log(start, end);
              if (index >= start && index < end) {
                count++
                //console.log(key, index, start, end)
                console.log(index, start, end, feeds_per_screen)
                const inferredImage = dataItem[key].inferred_image;
                feedHTML += `
                                            <div class="operator-panel-feed p-0 position-relative operator-panel-feed-${feeds_per_screen === 3 ? 4 : feeds_per_screen}">
                                                ${inferredImage ?
                    `<img src="${inferredImage}" class="d-block w-100 reports-camera-feed-min-height h-100 bg-dark cursor-pointer" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';" onclick="showFeedInFullScreen('${inferredImage}')" />`
                    : `<div class="operator-panel-feed p-0 position-relative camera-not-available reports-camera-feed-min-height w-100 h-100">
                                        <img class="no-camera-img " src="../common/image/no_preview_camera.svg"/>
                                        </br></br>
                                        <p>Camera Not Available</p>
                                        <p>Your camera view will be displayed here once connected</p>
                                        </div>`}
                                                <div class="position-absolute position-result-wrap d-flex">
                                                        <div class="position-wrap reports-posiiton-wrap">${key}
                                                        </div>
                                                        <div class="reports-status-wrap ${dataItem[key]?.is_accepted ? 'status-accepted' : 'status-rejected'}">
                                                            ${dataItem[key]?.is_accepted ? 'Accepted' : 'Rejected'}
                                                        </div>
                                                 
                                                </div>
                                            </div>
                                        `;
              }
            }
            const ocr_result = dataItem[key]?.ocr_text
            const bar_result = dataItem[key]?.bar_text
            const pd_result = dataItem[key]?.peripheral_device_data

            if (ocr_result) {
              ocr += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${ocr_result}</p>
                              </div>
                            </div>`
            }
            if (bar_result) {
              bar += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${bar_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${pd_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result === null) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">Peripheral Device Not Connected</p>
                              </div>
                            </div>`
              console.log('-------------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }
            if (pd_result === "") {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">--</p>
                              </div>
                            </div>`
              console.log('----------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }
          }


        })


        for (let i = count; i < (feeds_per_screen === 3 ? 4 : feeds_per_screen); i++) {
          feedHTML += `
                                <div class="operator-panel-feed operator-panel-feed-4"></div>
                            `;
        }

      } else if (view_type == 'grid') {
        waypoints_wrap.classList.remove('invisible')
        camera_feed.classList.add('row')
        camera_feed.classList.add('m-0')
        camera_feed.classList.add('p-0')
        camera_feed.style.height = '100%'
        camera_feed.classList.add('align-items-start')
        camera_feed.style.overflow = 'auto'
        const camera_feed_pagination = document.getElementById("camera-feed-pagination")
        const camera_feed_pagination_left = document.getElementById("operator-panel-feed-pagination-left")
        const camera_feed_pagination_right = document.getElementById("operator-panel-feed-pagination-right")
        camera_feed_pagination.classList.add('d-none')
        camera_feed_pagination_left.classList.add('d-none')
        camera_feed_pagination_right.classList.add('d-none')
        total_feeds = Object.keys(results[results.length - 1])?.length ? Object.keys(results[results.length - 1])?.length : total_feeds
        const count_div = total_feeds
        let col_size = 3
        switch (total_feeds) {
          case 1:
            col_size = 12
            break;
          case 2:
            col_size = 6
            break;
          case 3:
            col_size = 4
            break;
          case 4:
            col_size = 3
            break;
          default:
            col_size = 3
            break;
        }
        results?.forEach((dataItem, index) => {
          for (const [index, key] of Object.keys(dataItem).entries()) {
            if (dataItem.hasOwnProperty(key)) {
              // console.log(key)
              const inferredImage = dataItem[key].inferred_image;
              feedHTML += `
                                        <div class="col-md-${col_size} p-0 bg-dark position-relative operator-image-feed" style="height:${col_size === 12 ? '' : '25vh'}">
                                            ${inferredImage ?
                  `<img src="${inferredImage}" class="d-block w-100 reports-camera-feed-min-height h-100 bg-dark cursor-pointer" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';" onclick="showFeedInFullScreen('${inferredImage}')" />`
                  : `<div class=" camera-not-available d-flex justify-content-center align-items-center p-0 h-100 flex-wrap align-content-center">
                                        <img width="75" src="../common/image/no_preview_camera.svg"/>
                                        <p class="m-0 fw-5" style="width : 100%; color : #fff; text-align : center; font-size:12px">Camera Not Available</p>
                                        <p class="m-0 " style="width : 100%; color : #fff; text-align : center;font-size:10px">Your camera view will be displayed here once connected</p>
                                        </div>`}
                                            <div class="position-absolute position-result-wrap d-flex">
                                                        <div class="position-wrap reports-posiiton-wrap result-position-grid-wrap">${key}
                                                        </div>
                                                        <div class="reports-status-wrap ${dataItem[key]?.is_accepted ? 'status-accepted' : 'status-rejected'}">
                                                            ${dataItem[key]?.is_accepted ? 'Accepted' : 'Rejected'}
                                                        </div>
                                                </div>
                                        </div>
                                        `
            }

            const ocr_result = dataItem[key]?.ocr_text
            const bar_result = dataItem[key]?.bar_text
            const pd_result = dataItem[key]?.peripheral_device_data

            if (ocr_result) {
              ocr += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${ocr_result}</p>
                              </div>
                            </div>`
            }
            if (bar_result) {
              bar += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${bar_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${pd_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result === null) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">Peripheral Device Not Connected</p>
                              </div>
                            </div>`
              console.log('-------------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }
            if (pd_result === "") {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">--</p>
                              </div>
                            </div>`
              console.log('----------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }

          }
        })

        camera_feed.innerHTML = feedHTML

      } else {
        waypoints_wrap.classList.add('invisible')
        camera_feed.classList.add('row')
        camera_feed.style.height = ''
        camera_feed.classList.add('m-0')
        camera_feed.classList.add('p-0')
        camera_feed.classList.add('align-items-start')
        camera_feed.style.overflow = 'auto'
        /* The above code is setting the background color of an element with the id "camera_feed" to a
        semi-transparent black color (#191919e6). */
        camera_feed.style.backgroundColor = '#191919e6'
        const camera_feed_pagination = document.getElementById("camera-feed-pagination")
        const camera_feed_pagination_left = document.getElementById("operator-panel-feed-pagination-left")
        const camera_feed_pagination_right = document.getElementById("operator-panel-feed-pagination-right")
        camera_feed_pagination.classList.add('d-none')
        camera_feed_pagination_left.classList.add('d-none')
        camera_feed_pagination_right.classList.add('d-none')
        all_results = response?.last_result?.inspection_result?.results
        // console.log('all result', flattenedArray);
        // totalPositions = position_status_array[1].split('P')
        // console.log('total positions', parseInt(totalPositions[1]) + 1, 'total camera', total_camera_initialized);
        // total_feeds = Object.keys(results[results.length - 1])?.length ? Object.keys(results[results.length - 1])?.length : total_feeds

        all_results?.forEach((dataItem, index) => {
          for (const [index, key] of Object.keys(dataItem).entries()) {
            if (dataItem.hasOwnProperty(key)) {
              // console.log(key)
              const inferredImage = dataItem[key].inferred_image;
              feedHTML += `
                                        <div class="col-md-3 p-0 bg-dark position-relative operator-image-feed" style="">
                                            ${inferredImage ?
                  `<img src="${inferredImage}" class="d-block w-100 reports-camera-feed-min-height h-100 bg-dark cursor-pointer" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';" onclick="showFeedInFullScreen('${inferredImage}')" />`
                  : `<div class=" camera-not-available d-flex justify-content-center align-items-center p-0 h-100 flex-wrap align-content-center" style="height:17vh !important">
                                        <img width="75" src="../common/image/no_preview_camera.svg"/>
                                        <p class="m-0 fw-5" style="width : 100%; color : #fff; text-align : center; font-size:12px">Camera Not Available</p>
                                        <p class="m-0 " style="width : 100%; color : #fff; text-align : center;font-size:10px">Your camera view will be displayed here once connected</p>
                                        </div>`}
                                            <div class="position-absolute position-result-wrap d-flex">
                                                        <div class="position-wrap reports-posiiton-wrap result-position-grid-wrap">${key}
                                                        </div>
                                                        <div class="reports-status-wrap ${dataItem[key]?.is_accepted ? 'status-accepted' : 'status-rejected'}">
                                                            ${dataItem[key]?.is_accepted ? 'Accepted' : 'Rejected'}
                                                        </div>
                                                </div>
                                        </div>
                                        `
            }

            const ocr_result = dataItem[key]?.ocr_text
            const bar_result = dataItem[key]?.bar_text
            const pd_result = dataItem[key]?.peripheral_device_data

            if (ocr_result) {
              ocr += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${ocr_result}</p>
                              </div>
                            </div>`
            }
            if (bar_result) {
              bar += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${bar_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">${pd_result}</p>
                              </div>
                            </div>`
            }
            if (pd_result === null) {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">Peripheral Device Not Connected</p>
                              </div>
                            </div>`
              console.log('-------------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }
            if (pd_result === "") {
              pd += `<div class="livis-defect-body">
                              <div class="livis-defect-item my-3">
                                <p>${key}<p>
                                <p id="ocr-result">--</p>
                              </div>
                            </div>`
              console.log('----------');
              showPdDataEntry(data?.data?.data?.last_result?.inspection_result?._id, key, dataItem[key]?.label_name)
            }

          }
        })

        camera_feed.innerHTML = feedHTML
      }
    } else {
      //console.log(total_feeds, feeds_per_screen)
      for (let i = 0; i < feeds_per_screen; i++) {
        feedHTML += `
                        <div class="operator-panel-feed operator-panel-feed-${feeds_per_screen === 3 ? 4 : feeds_per_screen}"><img src="../common/image/no_preview.svg" /></div>
                    `;
      }
      if (feeds_per_screen == 3) {
        feedHTML += `
                        <div class="operator-panel-feed operator-panel-feed-4"></div>
                    `;
      }
    }
    camera_feed.innerHTML = feedHTML

    const reject_reasons = document.getElementById("livis-reject-reason")
    reject_reasons.classList.remove("d-none")

    const reasons_block = document.getElementById("livis-reject-reason-block")
    let logic_type = response?.last_result?.inspection_result?.logic_type
    let reasonsHTML = ``
    if (logic_type == 'camerawise') {
      console.log('camerawise----->', results);
      results?.forEach((dataItem, index) => {
        for (const key in dataItem) {
          if (dataItem.hasOwnProperty(key)) {
            // //console.log(dataItem, index, dataItem[key], key, dataItem[key]?.reject_reason)
            reasonsHTML +=
              `
                            <div class="livis-defect-item my-3">
                                <p>${key}</p>
                                <p>${dataItem[key]?.reject_reason?.length > 0 ? (function () {
                let temp = ''
                for (const i in dataItem[key]?.reject_reason) {
                  temp += `<ul>${dataItem[key]?.reject_reason[i].replaceAll('_', ' ')}</ul>`
                }
                return temp;
              })() : "--"}</p>
                            </div>
                            `
          }
        }
      })
    } else if (logic_type == 'positionwise') {
      if (position_index < 0) {
        results = [response?.last_result?.inspection_result?.positionwise_results]
        // selectedPosition = response?.last_result?.inspection_result?.positionwise_results?.length - 1
      } else {
        results = [response?.last_result?.inspection_result?.positionwise_results]
        // selectedPosition = position_index
      }
      console.log('positionwise----->', results);

      results?.forEach((dataItem, index) => {
        for (const key in dataItem) {
          if (dataItem.hasOwnProperty(key)) { }
          reasonsHTML +=
            `
                            <div class="livis-defect-item my-3">
                                <p>${key}</p>
                                <p>${dataItem[key]?.reject_reason?.length > 0 ? (function () {
              let temp = ''
              for (const i in dataItem[key]?.reject_reason) {
                temp += `<ul>${dataItem[key]?.reject_reason[i].replaceAll('_', ' ')}</ul>`
              }
              return temp;
            })() : "--"}</p>
                            </div>
                            `
        }
      })

    } else if (logic_type == 'partwise') {
      if (position_index < 0) {
        results = [response?.last_result?.inspection_result?.partwise_results]
      } else {
        results = [response?.last_result?.inspection_result?.partwise_results]
      }
      console.log('partwise----->', results);
      for (const key in results) {
        reasonsHTML +=
          `
                            <div class="livis-defect-item my-3">
                                <p>${results[key]?.reject_reason?.length > 0 ? (function () {
            let temp = ''
            for (const i in results[key]?.reject_reason) {
              temp += `<ul>${results[key]?.reject_reason[i].replaceAll('_', ' ')}</ul>`
            }
            return temp;
          })() : "--"}</p>
                            </div>
                            `
      }
    }
    if (reasons_block)
      reasons_block.innerHTML = reasonsHTML
    // if (status) {
    //   reject_reasons.classList.add("d-none")
    // } else {
    //   reject_reasons.classList.remove("d-none")
    // }

    const features_wrap = document.getElementById("features-wrap")
    const defects_wrap = document.getElementById("defects-wrap")
    const feature_count = document.getElementById('feature_count')
    const defect_count = document.getElementById('defect_count')
    const avg_cycle_time = document.getElementById('cycle-time-wrap')
    let defects
    let features
    if (logic_type == 'partwise' || logic_type == 'camerawise') {
      defects = response?.last_result?.inspection_result?.partwise_results.defects
      features = response?.last_result?.inspection_result?.partwise_results.features
    } else if (logic_type == 'positionwise') {
      defects = response?.last_result?.inspection_result?.positionwise_results[position_index > 0 ? position_index : `P${Object.keys(response?.last_result?.inspection_result?.positionwise_results)?.length - 1}`]?.defects                //to be changed later for SE TARA ONLY
      features = response?.last_result?.inspection_result?.positionwise_results[position_index > 0 ? position_index : `P${Object.keys(response?.last_result?.inspection_result?.positionwise_results)?.length - 1}`]?.features
    }

    const avgCycleTime = response?.last_result?.average_cycle_time
    let featureHTML = ``
    let defectHTML = ``
    let cyleTimeHTML = ``
    for (const key in defects) {
      defectHTML += `
                        <div class="livis-defect-item">
                            <p class="invisible"></p>
                            <p>${key?.replaceAll('_', ' ')}:${defects[key]}</p>
                        </div>
                    `
    }
    defects_wrap.innerHTML = defectHTML
    for (const key in features) {
      featureHTML += `
                        <div class="livis-defect-item">
                            <p class="invisible"></p>
                            <p>${key.replaceAll('_', ' ')}:${features[key]}</p>
                        </div>
                    `
    }
    features_wrap.innerHTML = featureHTML
    // defect_count.innerText = defects?.length ? defects?.length : '0'
    // feature_count.innerText = features?.length ? features?.length : '0'
    cyleTimeHTML = `
                        <div class="livis-defect-item my-3">
                            <p></p>
                            <p>${avgCycleTime ? avgCycleTime.toFixed(2) : "00"} secs</p>
                        </div>
                `
    avg_cycle_time.innerHTML = cyleTimeHTML
    const livis_opertor_batch = document.getElementById('livis-opertor-batch')
    livis_opertor_batch.style.pointerEvents = ""
  } else {
    localStorage.setItem("is_running", false)
    console.log('settting false')
    if (operatorPanelConfiguration?.start_process?.start_process_type == "start_using_plc") {
      startProcessEvent?.close()
      startProcessSSE()
    }
    clearData()
  }
}

const pd_update_modal = new bootstrap.Modal(document.getElementById('update-pd-data-modal'))
let current_inspection_id
let current_pd_key
let current_pd_label

/**
 * The function `showPdDataEntry` sets variables based on input parameters and displays a message in
 * the DOM if a certain condition is met.
 * @param id - The `id` parameter is used to store the current inspection ID for the data entry.
 * @param key - The `key` parameter in the `showPdDataEntry` function is used to specify a unique
 * identifier for the data entry field. It helps in identifying and accessing the specific data entry
 * field within the function.
 * @param label - The `label` parameter in the `showPdDataEntry` function represents the label or name
 * associated with the data entry field. It is used to provide a descriptive text to indicate what type
 * of data should be entered by the user.
 */
function showPdDataEntry(id, key, label) {
  current_inspection_id = id
  current_pd_key = key
  current_pd_label = label
  document.getElementById('pd-key').innerHTML = 'Enter Manual value for ' + label + ' under value ' + key
  if (workstation_data?.workstation_type === 'static')
    pd_update_modal.show()
}

/**
 * The function `updateManualOveride` updates a manual override option for a specific inspection and
 * triggers a page reload upon completion.
 * @param option - The `option` parameter in the `updateManualOveride` function represents the overall
 * result of a manual override action. It is used to update the manual override status for a specific
 * inspection identified by `current_inspection_id`. The `option` value will be passed as the new
 * overall result for the
 */
function updateManualOveride(option) {
  let payload = {
    inspection_id: current_inspection_id,
    overall_result: option,
  }
  console.log('<0><0>', payload);
  const manual_override_btn = document.getElementById('manual-override')
  post("/update_manual_override", payload, (result, msg) => {
    // getAllParts()
    ////console.log(result.data

    showToast('success', 'Manual Override Successful')
    manual_override_btn.disabled = false
    manual_override_btn.click()
    manual_override_btn.disabled = true
    setTimeout(() => {
      window.location.reload()
    }, 500);
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
 * The function `updatePdData` updates a specific inspection entry with a new value for a given key
 * using a PATCH request.
 */
function updatePdData() {
  let payload = {
    _id: current_inspection_id,
    key: current_pd_key,
    value: document.getElementById('pd_data').value
  }
  console.log('<0><0>', payload);
  patch("/update_inspection_entry", payload, (result, msg) => {
    // getAllParts()
    ////console.log(result.data)
    pd_update_modal.hide()

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
 * The function `showUpdateModal` clears a timer interval, stops an inspection with frequency, and then
 * displays an update batch modal.
 */
function showUpdateModal() {
  clearInterval(timerInterval)
  stopInspectionWithFrequncy()
  update_batch_modal.show()
}

/**
 * The function `HealthcheckForAllFalse` recursively checks if all values in a nested object are false.
 * @param obj - The `HealthcheckForAllFalse` function takes an object `obj` as a parameter. The
 * function recursively checks all values in the object and returns `false` if any value is `false`,
 * otherwise it returns `true`.
 * @returns The function `HealthcheckForAllFalse` is checking if all values in the object `obj` are
 * false. If any value is an object, it recursively calls itself to check all nested values. If any
 * value is false, the function returns false. If all values are true or all nested values are true,
 * the function returns true.
 */
function HealthcheckForAllFalse(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      if (!HealthcheckForAllFalse(obj[key])) {
        return false;
      }
    } else {
      if (obj[key] === false) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The function `getFalseStatusObjects` recursively traverses an object to find and return all nested
 * objects with a key of 'status' set to false.
 * @param obj - The function `getFalseStatusObjects` takes an object as a parameter and recursively
 * traverses through its properties to find objects that have a key named 'status' with a value of
 * false. It then collects these objects into an array and returns them.
 * @returns The `getFalseStatusObjects` function returns an array of objects that have a key named
 * 'status' with a value of false.
 */
function getFalseStatusObjects(obj) {
  const falseStatusObjects = [];

  function traverse(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        traverse(obj[key]);
      } else {
        if (key === 'status' && obj[key] === false) {
          falseStatusObjects.push(obj);
          break;
        }
      }
    }
  }

  traverse(obj);
  return falseStatusObjects;
}

/**
 * The function `byPassHardwareCheck` sets the `hardware_status` variable to `false` and hides the
 * hardware connectivity modal.
 */
function byPassHardwareCheck() {
  hardware_status = false
  hardware_connectivity_modal.hide()
}

function resetInspection() {

  get('/reset_inspection', (result, msg) => {
    showToast('success', "Inspection Resseted")
    getRunningProcess()
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

let inspectPlcSSE
let total_camera_initialized = 1

/**
 * The `inspectPlc` function sets up an EventSource connection to a server's SSE endpoint and handles
 * different types of events related to inspecting a PLC, including updating UI elements and checking
 * for inspection completion.
 */
function inspectPlc() {
  startProcessEvent?.close()
  inspectPlcSSE = new EventSource(BASE_URL + "/inspection_polling"); // Replace with your server's SSE endpoint URL

  // Add event listeners for different types of events
  inspectPlcSSE.addEventListener("message", function (event) {
    const inspect_btn = document.getElementById("inspect")
    const data = event?.data ? JSON.parse(event?.data) : false
    console.log('inspect poll', data)

    if (JSON.stringify(data?.data ? data?.data : {}) != '{}') {
      inspect_btn.disabled = false
      inspect_btn.innerText = 'Inspect'
      // console.log('inspect result show', JSON.stringify(data?.data ? data?.data : {}))
      console.log(hardware_status);
      if (hardware_status) {
        total_camera_initialized = Object.keys(data.data.data?.hardware_health_status?.camera_status).length + 1 ? Object.keys(data.data.data?.hardware_health_status?.camera_status).length + 1 : 1
        if (getFalseStatusObjects(data.data.data.hardware_health_status).length > 0) {
          console.log('---------show health check modal-------', data.data.data.hardware_health_status);
          openHardwareConnectivityModal(getFalseStatusObjects(data.data.data.hardware_health_status))
        }
      }
      if (data?.is_inspection_running) {
        start_inspect_box.classList.add('d-none')
        stop_inspect_box.classList.remove('d-none')
      }
      if (data.data.data?.last_result) {
        showInspectResult(data)
      }
      // getRunningProcess()
    }
    console.log(data.data.data?.stop_process_state, "<<<<<<<<<<<< polling stop ka status")
    if (data.data.data?.stop_process_state) {
      inspectPlcSSE.close()
      endProcess()
    }

    // if (data == "True") {
    //     startProcessEvent.close();
    //     showStartProcessForm()
    // }

    // inspect_btn.disabled = true
    // inspect_btn.innerText = 'Inspecting ...'


    // //after response

  });

  inspectPlcSSE.addEventListener("open", function (event) {
    // Handle 'open' event (connection established)
    //console.log("SSE Connection is open");
  });

  inspectPlcSSE.addEventListener("error", function (event) {
    // Handle 'error' event (connection error)
    if (event.target.readyState === EventSource.CLOSED) {
      //////////console.log("SSE Connection was closed");
    } else {
      console.error("SSE Connection error:", event);
    }
  });
}

/**
 * The function `closedStartProcessModal` enables form fields, updates submit button text, stops a
 * timer interval, and triggers a specific process based on a condition.
 */
function closedStartProcessModal() {
  document.getElementById('part_name').disabled = false
  document.getElementById('batch_id').disabled = false
  document.getElementById('batch_size').disabled = false
  document.getElementById('auto_batching_size').disabled = false
  document.getElementById('start-process-form-submit').innerText = 'Submit '
  clearInterval(timerInterval)
  if (operatorPanelConfiguration?.start_process?.start_process_type == "start_using_plc") {
    startProcessEvent?.close()
    startProcessSSE()
  }
}

/**
 * The function `showStartProcessForm` closes a start process event, shows a start process modal, and
 * potentially clears an interval.
 */
function showStartProcessForm() {
  startProcessEvent?.close()

  start_process_modal.show()
  // clearInterval(metrixInterval);
}

/**
 * The `startProcess` function handles the process of starting a batch with provided data and options,
 * including setting local storage intervals and making a POST request to create a batch.
 * @param [withFormData=false] - The `withFormData` parameter in the `startProcess` function is a
 * boolean parameter that determines whether to process form data. If set to `true`, the function will
 * collect data from form elements and include it in the payload sent to the server. If set to `false`
 * or not provided,
 */
function startProcess(withFormData = false) {
  start_process_modal.hide()
  const data = {}
  const start_process_details = document.getElementById("start-process-form")
  // console.log(autoBatchingSwitch.checked)
  if (withFormData) {
    for (const element of start_process_details.elements) {
      if (!element.classList.contains('d-none')) {
        if (element.name) {
          data[element.name] = element.value;
        }
      }
    }
  }
  data['batch_size'] = parseInt(data['batch_size'])
  if (!data['batch_size']) {
    data['batch_size'] = selectedBatch['Batch size']
  }

  let payload = {
    "part_index": data['part_name'],
    "batch_size": data['batch_size'],
    "batch_name": data['batch_id'],
    "is_auto_batching": autoBatchingSwitch.checked,
    "remark": data['remarks']
  }
  // console.log('value', inspection_interval.value == "");
  if (inspection_interval.value == "") {
    console.log('removing localstorage interval');
    localStorage.removeItem('inspection_interval')

  }
  else {
    console.log('setting localstorage interval');
    localStorage.setItem('inspection_interval', inspection_interval.value)

  }
  requestOptions.body = JSON.stringify(payload)
  // ////console.log(data)
  // return
  const inspect_btn = document.getElementById("inspect")
  inspect_btn.disabled = false
  // fetch(BASE_URL + '/create_batch', requestOptions).then((response) => {
  //   // Check if the response status is OK (200)
  //   if (!response.ok) {
  //     throw new Error('Network response was not ok');
  //   }
  //   // Parse the response body as JSON
  //   return response.json();
  // })
  //   .then((data) => {
  //     // const batch_id = batches?.find(item => item?.batch_name == payload?.batch_name)?._id
  //     localStorage.setItem('current_batch_id', data?.data?.data?._id)
  //     if (localStorage.getItem('inspection_interval') != null)
  //       startInspectionWithFrequncy()

  //     showToast("success", "Process Started Successfully")
  //     // Handle the JSON data here
  //     ////////////console.log('JSON data:', data);
  //     getRunningProcess()
  //     //////////console.log("Came here in try")

  //   })
  //   .catch((error) => {
  //     // Handle any errors that occurred during the fetch
  //     console.error('Fetch error:', error);
  //     //////////console.log("Came here in catch")

  //   });
  post('/create_batch', payload, async (data, msg) => {
    localStorage.setItem('current_batch_id', data?.data?.data?._id)
    if (localStorage.getItem('inspection_interval') != null)
      startInspectionWithFrequncy()

    showToast("success", "Process Started Successfully")
    // Handle the JSON data here
    ////////////console.log('JSON data:', data);
    getRunningProcess()
    //////////console.log("Came here in try")
  }, async (err, msg) => {
    console.error('Fetch error:', error);
  })

}


/**
 * The function `getRunningProcess` retrieves running process data from an API, handles the response,
 * and displays the inspection results based on the position parameter.
 * @param [position] - The `position` parameter in the `getRunningProcess` function is used to specify
 * the position of the running process. If `position` is less than 0, the `showInspectResult` function
 * is called without specifying a position. If `position` is greater than or equal to 0
 * @returns The `getRunningProcess` function is returning either nothing (undefined) or the result of
 * calling the `showInspectResult` function with the `data` object and an optional `position` argument.
 */
function getRunningProcess(position = -1) {
  const startedbatch = localStorage.getItem("current_batch_id")
  if (!startedbatch) {
    setIsLoading(false, 'Please Wait Until the setup is ready')
    clearData()
    return
  }
  // //console.log(startedbatch)
  getMegaReport(startedbatch)
  part_number.classList.add('d-none')
  fetch(BASE_URL + '/get_running_status/' + startedbatch).then((response) => {
    // Check if the response status is OK (200)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    // Parse the response body as JSON
    return response.json();
  })
    .then((data) => {
      setIsLoading(false, 'Please Wait Until the setup is ready')
      console.log('<><><><><>', data);
      // Handle the JSON data here
      // console.log('JSON data:', data?.data?.data?.is_running, (operatorPanelConfiguration?.start_process?.start_process_type == 'start_using_plc'));
      localStorage.setItem('current_part_name', data?.data?.data?.part_name)

      if (data?.data?.data?.is_running) {
        if (data?.data?.data?.inspection_mode == 'continuous') {

          start_inspect_box.classList.remove('d-none')
          inspect_box.classList.add('d-none')
        }
        document.getElementById('startinspect').disabled = false
        inspectPlcSSE?.close()
        inspectPlc()
      }
      // console.log('show result running process')
      console.log(position);
      if (position < 0)
        showInspectResult(data)
      else
        showInspectResult(data, position)

    })
    .catch((error) => {
      // Handle any errors that occurred during the fetch
      console.error('Fetch error:', error);
      clearData()
      setIsLoading(false, 'Please Wait Until the setup is ready')
    });
}

/**
 * The function `startInspectionWithFrequncy` logs '1111', retrieves the inspection frequency, and sets
 * an interval to call the `inspect` function at that frequency.
 */
function startInspectionWithFrequncy() {
  console.log('1111')
  getInspectFrequency()
  inspect_frequency_setinterval_id = setInterval(inspect, inspect_frequency)

}

/**
 * The function `stopInspectionWithFrequncy` logs '0000' to the console and clears a setInterval timer
 * identified by `inspect_frequency_setinterval_id`.
 */
function stopInspectionWithFrequncy() {
  console.log('0000');
  clearInterval(inspect_frequency_setinterval_id)
  inspect_frequency_setinterval_id = -1
}


// /**
//  * The function `getCameraFeed` fetches camera feeds data, processes the response, and updates the UI
//  * with camera model buttons based on the retrieved data.
//  */
// function getCameraFeed() {
//   const startedbatch = localStorage.getItem("current_batch_id")
//   fetch(BASE_URL + '/get_camera_feeds_url/' + startedbatch).then((response) => {
//     // Check if the response status is OK (200)
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     // Parse the response body as JSON
//     return response.json();
//   })
//     .then((data) => {
//       feeds = data?.data?.image_feeds
//       const models = Object.keys(feeds)
//       let modelHTML = ``
//       for (let i = 0; i < models.length; i++) {
//         modelHTML += `
//                 <button id="camera-model-${models[i]}" class="btn livis-health-software-btn ${i == 0 ? 'active-health-check-btn' : ''} livis-model-position-btn livis-camera-model"
//                 onclick="setCameraModel('${models[i]}')">${models[i]}</button>
//                 `
//       }
//       camera_model.innerHTML = modelHTML
//       if (models?.length) {
//         selectedCameraModel = models[0]
//         getPositions(models[0])

//       }
//     })
//     .catch((error) => {
//       // Handle any errors that occurred during the fetch
//       console.error('Fetch error:', error);
//       clearData()
//       setIsLoading(false, 'Please Wait Until the setup is ready')
//     });
// }

/**
 * The function `getPositions` generates HTML buttons for camera positions based on the input value and
 * sets the selected camera position.
 * @param value - The `getPositions` function takes a `value` parameter as input. This parameter is
 * used to retrieve camera positions from the `feeds` object based on the provided value. The function
 * then generates HTML buttons for each camera position and sets the first position as active by
 * default.
 */
function getPositions(value) {
  const m0 = value
  const positions = Object.keys(feeds[m0])
  let positionHTML = ``
  for (let i = 0; i < positions.length; i++) {
    positionHTML += `
    <button id="camera-position-${positions[i]}" class="btn livis-health-software-btn ${i == 0 ? 'active-health-check-btn' : ''} livis-model-position-btn livis-camera-position"
    onclick="setCameraPosition('${positions[i]}')">${positions[i]}</button>
    `
  }
  camera_position.innerHTML = positionHTML
  if (positions?.length) {
    selectedCameraPosition = Object.keys(feeds[m0])[0]
    getCameraFeeds(Object.keys(feeds[m0])[0])
  }
}

/**
 * The function `getCameraFeeds` generates HTML elements for displaying camera feeds based on the
 * selected camera model and position.
 * @param value - It looks like the `getCameraFeeds` function is responsible for generating HTML
 * elements for camera feeds based on the selected camera model and position. The function loops
 * through the feeds for the selected camera and creates HTML elements for each feed.
 */
function getCameraFeeds(value) {
  //console.log(value, feeds[selectedCameraModel][selectedCameraPosition])
  feeds_per_screen = Object.keys(feeds[selectedCameraModel][selectedCameraPosition])?.length
  let html = ``
  for (let i = 0; i < feeds_per_screen; i++) {
    const feed = Object.values(feeds[selectedCameraModel][selectedCameraPosition])?.[i]?.inference
    html += `
            <div class="operator-panel-feed operator-panel-feed-${feeds_per_screen === 3 ? 4 : feeds_per_screen}">
                <img src="${feed}" style="width : 100%; height : 100%"/>
            </div>
        `;
  }
  if (feeds_per_screen == 3) {
    html += `
            <div class="operator-panel-feed operator-panel-feed-4"></div>
        `;
  }
  camera_feed.innerHTML = html
}

/**
 * The function `setCameraModel` sets the selected camera model, updates the UI to highlight the
 * selected model, and then calls the `getPositions` function with the selected model as a parameter.
 * @param model - The `setCameraModel` function takes a `model` parameter as input. This parameter
 * represents the camera model that will be set as the selected camera model. The function then updates
 * the `selectedCameraModel` variable with the provided model value, removes the
 * 'active-health-check-btn' class from all
 */
function setCameraModel(model) {
  selectedCameraModel = model
  //console.log(selectedCameraModel)
  var elements = document.querySelectorAll('.livis-camera-model');
  elements.forEach(function (element) {
    element.classList.remove('active-health-check-btn');
  });
  document.getElementById(`camera-model-${model}`).classList.add("active-health-check-btn")
  getPositions(model)
}

/**
 * The function `setCameraPosition` sets the selected camera position, updates the active class for
 * camera position elements, and retrieves camera feeds based on the selected position.
 * @param position - The `position` parameter in the `setCameraPosition` function represents the
 * position of the camera that you want to set. It is used to update the selected camera position,
 * highlight the corresponding camera position element in the UI, and fetch camera feeds for that
 * specific position.
 */
function setCameraPosition(position) {
  selectedCameraPosition = position
  //console.log(selectedCameraPosition)
  var elements = document.querySelectorAll('.livis-camera-position');
  elements.forEach(function (element) {
    element.classList.remove('active-health-check-btn');
  });
  document.getElementById(`camera-position-${position}`).classList.add("active-health-check-btn")
  getCameraFeeds(position)
}

/**
 * The `clearData` function resets various elements and values on the page to prepare for a new
 * inspection process.
 */
function clearData() {
  end_process_btn.classList.add('d-none')
  end_process_box.classList.add('d-none')
  // inspect_btn.classList.add('d-none')
  console.log('clearing data');
  inspect_btn.disabled = true
  start_process_btn.classList.remove('d-none')
  end_process_btn.classList.add('d-none')
  inspect_btn.disabled = true
  retry_inspect.disabled = true
  start_process_btn.classList.remove('d-none')
  start_process_wrap.classList.remove('d-none')
  if (eventSource) {
    eventSource.close();
    //////////console.log("SSE Connection closed");
  }
  waypoints_wrap.innerHTML = '<h6 class="d-flex align-items-center" style="color: black;">Positions:</h6>'
  status_bar.innerText = 'READY TO INSPECT'
  status_bar.classList.remove('accepted')
  status_bar.classList.remove('rejected')
  accepted_count.innerText = 0
  rejected_count.innerText = 0
  aborted_count.innerText = 0
  current_batch_count.innerText = 0
  total_count.innerText = 0
  const reject_reasons = document.getElementById("livis-reject-reason")
  reject_reasons.classList.add("d-none")
  const camera_feed = document.getElementById("camera-feed")
  let html = ``
  //append number of feeds
  for (let i = 0; i < feeds_per_screen; i++) {
    html += `
        <div class="operator-panel-feed operator-panel-feed-${feeds_per_screen === 3 ? 4 : feeds_per_screen}"><img src="../common/image/no_preview.svg" /></div>
    `;
  }
  if (feeds_per_screen == 3) {
    html += `
        <div class="operator-panel-feed operator-panel-feed-4"></div>
    `;
  }
  camera_feed.innerHTML = html
  part_name.innerText = '--'
  batch_id.innerText = '--'
  batch_size.innerText = "of " + '--'
  current_batch_size.innerText = '--'
  total_count.innerText = '/ 0'
  const livis_opertor_batch = document.getElementById('livis-opertor-batch')
  livis_opertor_batch.style.pointerEvents = "none"
  stopInspectionWithFrequncy()
}

/**
 * The function `openUpdateBatchSizePopUp` sets the value of an input field to the batch size from
 * `batchDetails` if it exists.
 */
function openUpdateBatchSizePopUp() {
  //////////console.log("first", batchDetails)
  stopInspectionWithFrequncy()
  const update_batch_size = document.getElementById('update-batch-size')
  update_batch_size.value = batchDetails?.batch_size
}

/**
 * The `updateBatchSize` function updates the batch size based on user input, sending a PATCH request
 * to the server and displaying success or error messages accordingly.
 */
function updateBatchSize() {
  const update_batch_size = document.getElementById('update-batch-size')
  clearInterval(timerInterval);
  stopInspectionWithFrequncy()
  //////////console.log(update_batch_size.value, batchDetails['Batch size'])
  if (update_batch_size.value > batchDetails?.batch_size) {
    let payload = {
      "part_index": batchDetails?.part_index,
      "batch_name": batchDetails?.batch_name,
      "batch_size": parseInt(update_batch_size.value)
    }
    patch('/update_batch', payload, (result, msg) => {
      showToast("success", "New batch size updated successfully")
      // inspectPlcSSE.close()

      getRunningProcess()
      document.getElementById('end-process').disabled = false

      update_batch_modal.hide()
    }, (error, msg) => {
      if (msg) {
        //window.livisapi.livisShowNotification(msg);
        showToast('danger', msg)
      } else {
        //window.livisapi.livisShowNotification(error.message);
        showToast('danger', error.message)
      }
    })

  } else {
    showToast("warning", "New batch size cannot be less than old batch size")
    //window.livisapi.livisShowNotification('New Batch Size Should Be Greater Than Current Batch Size')
  }
}

//function for updating the inspection details
var metrixInterval = null
let eventSource
let current_cycle = ''
let current_position = ''
let current_camera = ''


/**
 * The function `getMetrix` establishes a connection to a server's SSE endpoint, listens for different
 * types of events, and updates the user interface based on the received data.
 */
function getMetrix() {
  eventSource = new EventSource(BASE_URL + "/operator_panel/stream"); // Replace with your server's SSE endpoint URL

  // Add event listeners for different types of events
  eventSource.addEventListener("message", function (event) {
    const result = JSON.parse(event.data) ? JSON.parse(event.data) : {}
    ////console.log(result)
    if (result?.is_completed) {
      const inspect_btn = document.getElementById("inspect")
      inspect_btn.disabled = false
      inspect_btn.innerText = 'Inspect'
      end_process_box.classList.remove('d-none')
      end_process_btn.classList.remove('d-none')
      // inspect_btn.classList.remove('d-none')
      inspect_btn.disabled = false
      start_process_btn.classList.add('d-none')
      start_process_wrap.classList.add('d-none')



      if (result?.is_batch_full) {
        update_batch_modal.show()
        setTimeout(() => {
          const update_part_name = document.getElementById("update_part_name")
          const update_batch_id = document.getElementById('update_batch_id')
          const update_batch_size = document.getElementById('update_batch_size')

          update_part_name.value = batchDetails['Part']
          update_batch_id.value = batchDetails['Batch name']
          update_batch_size.value = batchDetails['Batch size']
        }, 500);
      }

    }


    //////console.log(result?.status)
    if (result?.status?.overall_result) {
      if (result?.status?.overall_result == 'Accepted') {
        status_bar.innerText = 'ACCEPTED'
        status_bar.classList.add('accepted')
        status_bar.classList.remove('rejected')
      } else if (result?.status?.overall_result == 'Rejected') {
        status_bar.innerText = 'REJECTED'
        status_bar.classList.remove('accepted')
        status_bar.classList.add('rejected')
      }
    } else {
      status_bar.innerText = 'READY TO INSPECT'
      status_bar.classList.remove('accepted')
      status_bar.classList.remove('rejected')
    }

    accepted_count.innerText = result?.ac_count ? result?.ac_count : 0
    rejected_count.innerText = result?.rj_count ? result?.rj_count : 0
    aborted_count.innerText = result?.ab_count ? result?.ab_count : 0
    current_batch_count.innerText = result?.inspection_count ? result?.inspection_count : 0
    total_count.innerText = batchDetails['Batch size'] ? "/ " + batchDetails['Batch size'] : 0
    current_batch_size.innerText = result?.inspection_count

    let feedHTML = '';
    ////////console.log(workstation_data)
    if (workstation_data?.workstation_type == 'static') {
      // Extract M_1 and its sub-objects, excluding model_result
      const { M_1: { model_result, ...C_objects } } = result?.status;
      let count = Object.keys(C_objects).length
      for (const key in C_objects) {
        const result = C_objects[key];
        ////////console.log(result)
        if (result.image) {
          feedHTML += `
                            <div class="operator-panel-feed operator-panel-feed-${count} position-relative">
                                <img src="${result.image}" class="w-100 h-100" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';"/>
                                <div class="position-absolute position-result-wrap d-flex">
                                    <div class="position-wrap">${key}</div>
                                    <div class="${result.result == 'Accepted' ? 'status-accepted' : 'status-rejected'}">${result.result}</div>
                                </div>
                            </div>
                        `;
        } else {
          feedHTML += `
                            <img src="../common/image/no_preview.svg" />
                        `;
        }
      }

      const consolidatedCounts = {
        feature_predicted: {},
        defects_predicted: {},
        feature_actual: {},
        // defects_actual: {}
      };

      for (const MKey in result.status) {
        if (MKey.startsWith("M_")) {
          const M = result.status[MKey];

          for (const CKey in M) {
            const C = M[CKey];
            for (const feature in C.feature_predicted) {
              consolidatedCounts.feature_predicted[feature] = (consolidatedCounts.feature_predicted[feature] || 0) + 1;
            }
            for (const defect in C.defects_predicted) {
              consolidatedCounts.defects_predicted[defect] = (consolidatedCounts.defects_predicted[defect] || 0) + 1;
            }
            for (const feature in C.feature_actual) {
              consolidatedCounts.feature_actual[feature] = (consolidatedCounts.feature_actual[feature] || 0) + 1;
            }
            // for (const defect in C.defects_actual) {
            //     consolidatedCounts.defects_actual[defect] = (consolidatedCounts.defects_actual[defect] || 0) + 1;
            // }
          }
        }
      }

      //////console.log(consolidatedCounts);

      const defects_wrap = document.getElementById("defects-wrap")
      const features_wrap = document.getElementById("features-wrap")
      const feature_count = document.getElementById('feature_count')
      const defect_count = document.getElementById('defect_count')
      function createRatioHTML(predicted, actual) {
        return actual === 0 ? 'N/A' : `${predicted.replaceAll('_', ' ')} / ${actual.replaceAll('_', ' ')}`;
      }

      // Create HTML for each key
      const featureHTML = Object.keys(consolidatedCounts.feature_actual).map((key, value) => `
                    <div class="livis-defect-item">
                        <p>${key}(${value})</p>
                        <p>${createRatioHTML(consolidatedCounts.feature_predicted[key].replaceAll('_', ' ') || 0, consolidatedCounts.feature_actual[key].replaceAll('_', ' '))}</p>
                    </div>
                `).join('');

      const defectHTML = Object.keys(consolidatedCounts.defects_predicted).map(key => `
                    <div class="livis-defect-item">
                        <p>${key}(${value})</p>
                        <p>${consolidatedCounts.defects_predicted[key].replaceAll('_', ' ') || 0}</p>
                    </div>
                `).join('');

      defects_wrap.innerHTML = defectHTML
      features_wrap.innerHTML = featureHTML
      // defect_count.innerText = Object.keys(consolidatedCounts.defects_actual).length ? Object.keys(consolidatedCounts.defects_actual).length : '0'
      // feature_count.innerText = Object.keys(consolidatedCounts.feature_actual).length ? Object.keys(consolidatedCounts.feature_actual).length : '0'
      //////console.log(featureHTML, defectHTML)


    } else if (workstation_data?.workstation_type == 'cobot') {


      const cycleKeys = Object.keys(result?.status).filter(key => key.startsWith("cycle_"));
      ////console.log(cycleKeys)
      current_cycle = cycleKeys[cycleKeys.length - 1]


      const positionKeys = Object.keys(result?.status[current_cycle]).filter(key => key.startsWith("P"));
      current_position = positionKeys[positionKeys.length - 1]
      ////console.log(current_position)



      for (let i = 0; i < result.camera_count; i++) {
        const cameraKey = `C${i + 1}`;
        const camera = result?.status[current_cycle][current_position][cameraKey];
        feedHTML += `
                <div class="operator-panel-feed operator-panel-feed-${result.camera_count} position-relative">
                    <img src="${camera.image}?imgetag=${Math.random()}" class="w-100 h-100" onerror="this.onerror=null;this.src='../common/image/no_preview.svg';"/>
                    <div class="position-absolute position-result-wrap d-flex">
                        <div class="position-wrap">${current_cycle}</div>
                        <div class="position-wrap">${current_position}</div>
                        <div class="${camera.result == 'Accepted' ? 'status-accepted' : 'status-rejected'}">${camera.result}</div>
                    </div>
                </div>
            `;


        ////console.log(current_cycle, current_position, cameraKey, camera)
        const consolidatedCounts = {
          feature_predicted: {},
          feature_actual: {},
          defects_predicted: {},
        };

        for (const feature in camera.feature_predicted) {
          consolidatedCounts.feature_predicted[feature] = (consolidatedCounts.feature_predicted[feature] || 0) + 1;
        }
        for (const feature in camera.feature_actual) {
          consolidatedCounts.feature_actual[feature] = (consolidatedCounts.feature_actual[feature] || 0) + 1;
        }
        for (const defect in camera.defects_predicted) {
          consolidatedCounts.defects_predicted[defect] = (consolidatedCounts.defects_predicted[defect] || 0) + 1;
        }

        // const defects_wrap = document.getElementById("defects-wrap")
        const features_wrap = document.getElementById("features-wrap")
        const defects_wrap = document.getElementById("defects-wrap")
        const feature_count = document.getElementById('feature_count')
        const defect_count = document.getElementById('defect_count')

        function createRatioHTML(predicted, actual) {
          return actual === 0 ? 'N/A' : `${predicted.replaceAll('_', ' ')} / ${actual.replaceAll('_', ' ')}`;
        }


        // Create HTML for each key
        const featureHTML = Object.keys(consolidatedCounts.feature_actual).map((key, value) => `
                    <div class="livis-defect-item">
                        <p>${key}(${value})</p>
                        <p>${!key ? '--' : createRatioHTML(consolidatedCounts.feature_predicted[key] || 0, consolidatedCounts.feature_actual[key])}</p>
                    </div>
                `).join('');

        const defectHTML = Object.keys(consolidatedCounts.defects_predicted).map(key => {
          if (!key) {
            return `
                                <div class="livis-defect-item">
                                    <p></p>
                                    <p>--</p>
                                </div>
                            `;
          } else {
            return `
                                <div class="livis-defect-item">
                                    <p>${key}</p>
                                    <p>${consolidatedCounts.defects_predicted[key].replaceAll('_', ' ') || 0}</p>
                                </div>
                            `;
          }
        }).join('');

        defects_wrap.innerHTML = defectHTML
        features_wrap.innerHTML = featureHTML
        // defect_count.innerText = Object.keys(consolidatedCounts.defects_actual).length ? Object.keys(consolidatedCounts.defects_actual).length : '0'
        // feature_count.innerText = Object.keys(consolidatedCounts.feature_actual).length ? Object.keys(consolidatedCounts.feature_actual).length : '0'
      }
    }
    ////////console.log(feedHTML)
    camera_feed.innerHTML = feedHTML
    // }
  });

  eventSource.addEventListener("open", function (event) {
    // Handle 'open' event (connection established)
    //////////console.log("SSE Connection is open");
  });

  eventSource.addEventListener("error", function (event) {
    // Handle 'error' event (connection error)
    if (event.target.readyState === EventSource.CLOSED) {
      //////////console.log("SSE Connection was closed");
    } else {
      console.error("SSE Connection error:", event);
    }
  });

}

/**
 * The function `continueBatch` hides a modal, sends a payload to create a batch, enables a button, and
 * handles success and error responses.
 */
function continueBatch() {
  intermediate_summary_modal.hide();
  clearInterval(timerInterval)
  let payload = {
    part_index: batchDetails?.part_index,
    batch_name: batchDetails?.prefix,
    batch_size: batchDetails?.batch_size,
    is_auto_batching: true
  }
  requestOptions.body = JSON.stringify(payload)
  // ////console.log(data)
  // return
  const inspect_btn = document.getElementById("inspect")
  inspect_btn.disabled = false

  post('/create_batch', payload, async (data, msg) => {
    localStorage.setItem('current_batch_id', data?.data?.data?._id)
    update_batch_modal.hide()
    showToast("success", "Process Started Successfully")
    // Handle the JSON data here
    ////////////console.log('JSON data:', data);
    if (localStorage.getItem(inspection_interval) != null)
      startInspectionWithFrequncy()
    getRunningProcess()

  }, async (err, msg) => {
    console.error('Fetch error:', error);
  })


}

/**
 * The function `updateBatchFullSize` updates the batch size based on user input, with validation to
 * ensure the new size is greater than the current size.
 */
function updateBatchFullSize() {
  const update_batch_size = document.getElementById('update_batch_size')
  //////////console.log(update_batch_size.value, batchDetails['Batch size'])
  intermediate_summary_modal.hide();
  clearInterval(timerInterval)
  if (update_batch_size.value > batchDetails?.batch_size) {
    let payload = {
      "part_index": batchDetails?.part_index,
      "batch_name": batchDetails?.batch_name,
      "batch_size": parseInt(update_batch_size.value)
    }
    patch('/update_batch', payload, (result, msg) => {
      showToast("success", "New batch size updated successfully")
      if (localStorage.getItem('inspection_interval'))
        startInspectionWithFrequncy()
      getRunningProcess()
      update_batch_modal.hide()

    }, (error, msg) => {
      if (msg) {
        //window.livisapi.livisShowNotification(msg);
        showToast('danger', msg)
      } else {
        //window.livisapi.livisShowNotification(error.message);
        showToast('danger', error.message)
      }
    })

  } else {
    showToast("warning", "New batch size cannot be less than old batch size")
    //window.livisapi.livisShowNotification('New Batch Size Should Be Greater Than Current Batch Size')
  }
}

/**
 * The function `continueWithoutCalibration` ignores a calibration reminder and updates the UI
 * accordingly.
 */
function continueWithoutCalibration() {
  get('/ignore_calibration_reminder', (result, msg) => {
    showToast("warning", "You're continuing without calibrating")
    calibration_status_modal.hide()
    inspect_btn.disabled = false
    inspect_btn.innerText = 'Inspect'
    end_process.disabled = false
    retry_inspect.disabled = false
    current_page = 1; start = 0; end = feeds_per_screen;
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
 * The function `redirectToCalibrate` ends a process and redirects the user to the calibration page.
 */
function redirectToCalibrate() {
  endProcess()
  window.location.href = '../calibration/calibration.html'

}

/**
 * The function `inspect` checks if a batch inspection is in progress and sends a trigger to initiate
 * the inspection process, with the option to retry if needed.
 * @param [retry=false] - The `retry` parameter in the `inspect` function is a boolean parameter with a
 * default value of `false`. It is used to determine whether the inspection process should be retried
 * or not. If `retry` is set to `true`, the function will retry the inspection process and update the
 * UI
 */
function inspect(retry = false) {
  const startedbatch = localStorage.getItem("current_batch_id")
  ////console.log(batchDetails)
  if (startedbatch) {
    inspect_btn.disabled = true
    end_process.disabled = true
    // inspect_btn.innerText = 'Inspecting ...'
    retry_inspect.disabled = true
    if (retry)
      retry_inspect.innerText = 'Retrying...'
    if (count_of_inspections == current_batch_size_number && position_status_array[0] == position_status_array[1]) {
      update_batch_modal.show()
    }
    else {
      fetch(BASE_URL + `${retry ? '/send_trigger_retry' : '/send_trigger'}`).then((response) => {
        // Check if the response status is OK (200)
        // if (!response.ok) {
        //   throw new Error('Network response was not ok');
        // }
        if (response.status === 544) {
          console.log(response.status);
          document.getElementById('continue-button-calibration').classList.remove('d-none')
          calibration_status_modal.show()
        }
        else if (response.status === 545) {
          console.log(response.status);
          document.getElementById('continue-button-calibration').classList.add('d-none')
          calibration_status_modal.show()
        }
        else {
          inspect_btn.disabled = false
          inspect_btn.innerText = 'Inspect'
          end_process.disabled = false
          retry_inspect.disabled = false
          current_page = 1; start = 0; end = feeds_per_screen;
          if (retry)
            retry_inspect.innerText = 'Retry ' + `${data.data.data.last_result.inspection_result.retry_count > 0 ? '(' + data.data.data.last_result.inspection_result.retry_count + ')' : ''}`
          // Parse the response body as JSON
          return response.json();
        }

      })
        // .then((data) => {
        //     console.log('<------>', data.data.data.last_result.inspection_result.retry_count)
        //     inspect_btn.disabled = false
        //     inspect_btn.innerText = 'Inspect'
        //     end_process.disabled = false
        //     retry_inspect.disabled = false
        //     if (retry)
        //         retry_inspect.innerText = 'Retry ' + `${data.data.data.last_result.inspection_result.retry_count > 0 ? '(' + data.data.data.last_result.inspection_result.retry_count + ')' : ''}`
        //     // console.log('show result inspect UI');
        //     showInspectResult(data)



        // })
        .catch((error) => {
          // Handle any errors that occurred during the fetch
          console.error('Fetch error:', error);
        });
    }

  }

}


const end_process_btn = document.getElementById("end-process")
const end_process_box = document.getElementById("end_process_box")
end_process_btn.addEventListener('click', endProcessModal)
const end_process_modal = new bootstrap.Modal(document.getElementById("end-process-modal"))

/**
 * The function `endProcessModal` stops an inspection with frequency and then displays an end process
 * modal.
 */
function endProcessModal() {
  stopInspectionWithFrequncy()
  end_process_modal.show()
}

/**
 * The function cacleEndProcessModal checks for an inspection interval in localStorage, starts
 * inspection with frequency if found, and then hides the end process modal.
 */
function cacleEndProcessModal() {
  if (localStorage.getItem('inspection_interval'))
    startInspectionWithFrequncy()
  end_process_modal.hide()
}

/**
 * The function `startinspect` checks conditions and updates the visibility of certain elements on a
 * webpage.
 */
function startinspect() {
  inspect()
  if (!(count_of_inspections == current_batch_size_number && position_status_array[0] == position_status_array[1])) {

    start_inspect_box.classList.add('d-none')
    stop_inspect_box.classList.remove('d-none')
  }
  document.getElementById('stopinspect').disabled = false
}

/**
 * The function `stopinspect` sends a request to stop inspection and updates the UI accordingly.
 */
function stopinspect() {
  get('/stop_inspection_trigger', (result, msg) => {
    if (inspect_box.classList.contains('d-none')) {
      start_inspect_box.classList.remove('d-none')
      stop_inspect_box.classList.add('d-none')
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
 * The `endProcess` function handles the end process functionality by performing various tasks such as
 * closing modals, updating UI elements, resetting counts, and making API calls.
 */
function endProcess() {
  cacleEndProcessModal()
  getAllBatches()
  clearInterval(timerInterval);
  stopInspectionWithFrequncy()

  setIsLoading(true, "Please wait...")
  const end_process_btn = document.getElementById("end-process")
  const inspect_btn = document.getElementById("inspect")
  const start_process_btn = document.getElementById("start-process")
  const start_process_wrap = document.getElementById("start-process-wrap")
  stopinspect()
  let barcode_process = localStorage.getItem('barcode_process')
  get('/end_process', (data, msg) => {
    // console.log(data)

    if (data?.data?.batch_data?.is_auto_batching) {
      showStartProcessForm()
    }
    startProcessEvent?.close()
    inspectPlcSSE.close()
    if (operatorPanelConfiguration?.start_process?.start_process_type == "start_using_plc") {
      // inspectPlc()
      startProcessEvent?.close()
      inspectPlcSSE.close()
      startProcessSSE()
    }
    intermediate_summary_modal.hide()
    hardware_status = true

    localStorage.setItem("is_running", false)
    localStorage.removeItem('current_batch_id')
    localStorage.removeItem('current_part_name')
    start_inspect_box.classList.add('d-none')
    stop_inspect_box.classList.add('d-none')
    inspect_box.classList.remove('d-none')
    end_process_btn.classList.add('d-none')
    end_process_box.classList.add('d-none')
    inspect_btn.disabled = true
    retry_inspect.disabled = true
    start_process_btn.classList.remove('d-none')
    start_process_wrap.classList.remove('d-none')
    if (eventSource) {
      eventSource.close();
      //////////console.log("SSE Connection closed");
    }

    waypoints_wrap.innerHTML = '<h6 class="d-flex align-items-center" style="color: black;">Positions:</h6>'
    status_bar.innerText = 'READY TO INSPECT'
    status_bar.classList.remove('accepted')
    status_bar.classList.remove('rejected')

    accepted_count.innerText = 0
    rejected_count.innerText = 0
    aborted_count.innerText = 0
    current_batch_count.innerText = 0
    total_count.innerText = 0

    let feedHTML = ``
    cameraFeedCount = data?.data?.stream?.camera_count
    // if (cameraFeedCount) {
    //     for (let i = 0; i < cameraFeedCount; i++) {
    //         feedHTML += `
    //         <div class='w-50 h-100 bg-dark d-flex justify-content-center'>
    //         <img src="../common/image/no_preview.svg" style="border-radius : 1.25rem !important" class="w-25 h-100"/>
    //         </div>
    //         `
    //     }
    // }
    feedHTML += `
                        <div class='w-100 h-100 bg-dark d-flex justify-content-center'>
                        <img src="../common/image/no_preview.svg" style="border-radius : 1.25rem !important" class="w-25 h-100"/>
                        </div>
                        `
    camera_feed.innerHTML = feedHTML
    part_name.innerText = '--'
    batch_id.innerText = '--'
    batch_size.innerText = "of " + '--'
    current_batch_size.innerText = '--'
    total_count.innerText = '/ 0'
    retry_inspect.innerText = 'Retry ' + `${data.data.data?.last_result.inspection_result.retry_count > 0 ? '(' + data.data.data?.last_result.inspection_result.retry_count + ')' : ''}`

    const livis_opertor_batch = document.getElementById('livis-opertor-batch')
    livis_opertor_batch.style.pointerEvents = "none"


    const defects_wrap = document.getElementById("defects-wrap")
    const features_wrap = document.getElementById("features-wrap")
    const feature_count = document.getElementById('feature_count')
    const defect_count = document.getElementById('defect_count')
    const source_details = document.getElementById('source-details')
    const reject_reasons = document.getElementById("livis-reject-reason")

    source_details.innerHTML = ``

    defects_wrap.innerHTML = `<div class="livis-defect-item">
            <p></p>
            <p>--</p>
        </div>`
    features_wrap.innerHTML = `<div class="livis-defect-item">
            <p></p>
            <p>--</p>
        </div>`

    reject_reasons.innerHTML = `                            <div class="livis-defect-header">
                              <p data-i18n="reject_reasons">Reject Reasons</p>
                            </div>
                            <div class="livis-defect-body" id="livis-reject-reason-block">
                              <div class="livis-defect-item my-3">
                                <p></p>
                                <p>--</p>
                              </div>
                            </div>`
    // feature_count.innerText = '0'
    // defect_count.innerText = '0'
    setIsLoading(false, "Please wait...")
    if (barcode_process)
      window.location.href = '../deployment-manager/deployment.html'
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
 * The `ngOnInit` function in JavaScript handles various tasks such as checking URL parameters,
 * displaying success messages, setting up form fields, and managing timers for submitting a form.
 */
function ngOnInit() {
  setIsLoading(true, 'Please Wait Until the setup is ready')
  const urlParams = new URLSearchParams(window.location.search);
  console.log(urlParams.get('calibration_state'));
  const paramName = urlParams.get('deployed_now');
  const calibration_state = urlParams.get('calibration_state')


  if (paramName == 'true') {
    showToast("success", "Recipe deployed successfully");
    getOperatorPanelConfiguration()
    // Modify the URL without triggering a page reload
    const newUrl = removeURLParameter(window.location.href, 'deployed_now');
    history.replaceState({}, document.title, newUrl);
    barcode_details = JSON.parse(localStorage.getItem('barcode_details'))
    setTimeout(() => {
      start_process_modal.show()
      console.log(barcode_details);
      document.getElementById('part_name').value = barcode_details.part_data.part_index
      document.getElementById('batch_id').value = barcode_details.batch_name_data.batch_name
      document.getElementById('batch_size').value = barcode_details.batch_size_data.batch_size_config
      document.getElementById('auto_batching_size').checked = barcode_details.batch_size_data.is_auto_sizing
      document.getElementById('part_name').disabled = true
      document.getElementById('batch_id').disabled = true
      document.getElementById('batch_size').disabled = true
      document.getElementById('auto_batching_size').disabled = true
      document.getElementById('start-process-form-submit').disabled = false
      const endTime = new Date().getTime() + 5000; // 10 seconds
      timerInterval = setInterval(() => {
        const currentTime = new Date().getTime();
        const remainingTime = endTime - currentTime;
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        const formattedTime = '(' + seconds + ')';
        document.getElementById('start-process-form-submit').innerText = 'Submit ' + formattedTime;
        if (remainingTime <= 0) {
          clearInterval(timerInterval)
          document.getElementById('start-process-form-submit').click()
          localStorage.removeItem('barcode_details')
        }
      }, 100);

    }, 500);
  }
  if (calibration_state == 'true') {
    calibrationModeSwitch.setAttribute('checked', true)
    console.log('calibration active')
  }


  getRunningProcess()
  getAllBatches()
  getAllParts()
}

var batches = []
var filteredBatched = []
var allParts = []

/**
 * The function `getAllParts` retrieves all parts data and populates a dropdown list with the part
 * names and keys.
 */
function getAllParts() {
  const part_name = document.getElementById("part_name")
  get('/get_all_parts', (result, msg) => {
    allParts = result?.data?.data
    let html = ``
    for (let i = 0; i < allParts?.length; i++) {
      html += `
            <option value="${allParts[i]?.key}">${allParts[i]?.name}</option>
            `
    }
    part_name.innerHTML = html

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
 * The function `getAllBatches` retrieves all batches from a server and handles success and error
 * responses accordingly.
 */
function getAllBatches() {
  get('/get_all_batches', (result, msg) => {
    batches = filteredBatched = result?.data?.data
    if (batches && batches.length > 0) {
      setAllBatches(filteredBatched)
    } else {

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
 * The function `setAllBatches` generates HTML elements for each batch in a given array and assigns an
 * `onclick` event to set the batch ID.
 * @param batches - It looks like the `setAllBatches` function is designed to generate HTML elements
 * for a searchable dropdown list based on the `batches` array provided as a parameter. The function
 * iterates over each batch in the `batches` array and creates a clickable `div` element for each batch
 */
function setAllBatches(batches) {
  let batchIdHTML = ``
  for (let i = 0; i < batches.length; i++) {
    batchIdHTML += `
            <div onclick="setBatchId('${i}')" >${batches[i]?.batch_name}</div>
        `
  }
  livis_searchable_dropdown_list.innerHTML = batchIdHTML
}

var selectedBatch = {}

/**
 * The function `setBatchId` sets the selected batch ID, name, size, and enables the start process form
 * submit button.
 * @param value - The `value` parameter in the `setBatchId` function is used to determine which batch
 * to select from the `batches` array based on the index provided.
 */
function setBatchId(value) {
  selectedBatch = batches[value]
  ////console.log(batches[value])
  const batch_id = document.getElementById("batch_id");
  batch_id.value = selectedBatch?.batch_name;
  livis_searchable_dropdown_list.classList.add('d-none')
  const batch_size = document.getElementById("batch_size")
  batch_size.value = selectedBatch?.batch_size
  batch_size.disabled = true
  autoSizingSwitch.disabled = true
  const start_process_form_submit = document.getElementById("start-process-form-submit")
  start_process_form_submit.disabled = false
}

const livis_searchable_dropdown_wrap = document.getElementById("batch_id")
const livis_searchable_dropdown_list = document.getElementById("livis-searchable-dropdown-list")
// Add a focus event listener to the input element
livis_searchable_dropdown_wrap.addEventListener("focus", function () {
  livis_searchable_dropdown_list.classList.remove('d-none')
});

// Event listener to check when the input loses focus
livis_searchable_dropdown_wrap.addEventListener('blur', function () {
  // //console.log('Input is not active');
  setTimeout(() => {
    livis_searchable_dropdown_list.classList.add('d-none')
  }, 1000);
});

livis_searchable_dropdown_wrap.addEventListener("input", function () {
  const searchValue = this.value.trim(); // Get the trimmed input value
  // Filter the batch names array based on the searchValue
  if (searchValue.length > 0) {
    const filteredBatchNames = batches.filter(function (batch) {
      return batch?.batch_name.toLowerCase().includes(searchValue.toLowerCase());
      // return batch?.batch_name.toLowerCase() == searchValue.toLowerCase();
    });
    filteredBatched = filteredBatchNames
    if (filteredBatchNames.length == 0) {
      livis_searchable_dropdown_list.classList.add('d-none')
    } else {
      livis_searchable_dropdown_list.classList.remove('d-none')
    }
  } else {
    filteredBatched = batches
    livis_searchable_dropdown_list.classList.remove('d-none')

  }
  setAllBatches(filteredBatched)
  const batch_size = document.getElementById("batch_size")
  batch_size.classList.remove('d-none')
  if (autoSizingSwitch.checked) {
    batch_size.value = null
    batch_size.placeholder = "Using Default Batch Size"
  }
  else
    batch_size.value = 1
  batch_size.disabled = false
});


/**
 * The function `getMegaReport` retrieves recent inspection reports based on a specified batch ID and
 * displays them in a table on a web page.
 * @param batch_id - The `getMegaReport` function takes a `batch_id` as a parameter. This `batch_id` is
 * used to filter inspection reports and retrieve recent inspection data for that specific batch. The
 * function then generates an HTML table displaying details of the recent inspections, such as the
 * inspected datetime, part
 */
function getMegaReport(batch_id) {
  //////console.log(filterPayload)
  var filterPayload = {
    batch_id: batch_id
  }
  post("/get_recent_inspection_reports", filterPayload, (result, msg) => {
    // getAllParts()
    ////console.log(result.data)
    let html = ``
    const recent_inspection = document.getElementById("recent-inspection")
    reportsData = result?.data?.docs_list
    // source_details.innerText = reportsData[0]?.source_details ? (() => { document.getElementById('unique-serial-number').classList.remove('d-none'); return reportsData[0].source_details; })() : (() => { document.getElementById('unique-serial-number').classList.add('d-none'); return '--'; })()
    for (let i = 0; i < reportsData.length; i++) {
      if (i < 5) {
        html += `
                    <tr>
                        <td>${formatDateTime(reportsData[i]?.inspected_datetime)}</td>
                        <td>${reportsData[i]?.part_name}</td>
                        <td class="${reportsData[i]?.overall_acceptance ? 'livis-accept-text' : 'livis-reject-text'}">${reportsData[i]?.overall_acceptance ? 'Accepted' : 'Rejected'}</td>
                    </tr>
            `
      }

    }
    recent_inspection.innerHTML = html
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
 * The function `quitapp` calls the `quitApp` method from the `livisapi` object to exit the
 * application.
 */
function quitapp() {
  window.livisapi.quitApp()
}

//inspection summary modal
const inspection_summary_modal = new bootstrap.Modal(document.getElementById("inspection-summary-modal"))

// inspection_summary_modal.show()


/**
 * The function `showInspectionSummaryModal` displays the inspection summary modal.
 */
function showInspectionSummaryModal() {
  inspection_summary_modal.show()
}

/**
 * This JavaScript function closes a modal with the ID "inspection_summary_modal".
 */
function closeSummaryModal() {
  inspection_summary_modal.hide()
}

/**
 * The function `toggleSummaryModal` toggles the class "modal-fullscreen" on the element with the id
 * "inspection-summary-modal-ref".
 */
function toggleSummaryModal() {
  const inspection_summary_modal_ref = document.getElementById("inspection-summary-modal-ref")
  inspection_summary_modal_ref.classList.toggle("modal-fullscreen")
}


/**
 * The function restarts the application using the Livis API.
 */
function restart() {
  window.livisapi.restartApp()
}


/**
 * The function `handleStartProcessFrom` checks certain conditions and enables/disables a form submit
 * button accordingly.
 */
function handleStartProcessFrom() {
  const batch_id = document.getElementById("batch_id")
  // const batch_size = document.getElementById("batch_size")
  const start_process_form_submit = document.getElementById("start-process-form-submit")
  if ((batch_size.value !== undefined && batch_id.value !== "") && autoBatchingSwitch.checked) {
    console.log('tt1');
    start_process_form_submit.disabled = true
  } else if (autoSizingSwitch.checked && batch_id.value !== "") {
    start_process_form_submit.disabled = false
  } else if (autoSizingSwitch.checked && batch_id.value == "") {
    console.log('tt');
    start_process_form_submit.disabled = true
  } else {
    start_process_form_submit.disabled = false
  }
  if (batch_size.value <= 0 && !autoSizingSwitch.checked) {
    batch_size.value = 1
  }
}


/**
 * The function `changeViewType` changes the view type by adding an 'active' class to the selected
 * element and then calls the `getRunningProcess` function.
 * @param value - The `value` parameter in the `changeViewType` function represents the ID of the
 * element that was clicked or selected to change the view type.
 */
function changeViewType(value) {
  var elements = document.querySelectorAll('.grid-list-icon');
  elements.forEach(function (element) {
    element.classList.remove('active');
  });
  document.getElementById(value).classList.add("active")
  view_type = value
  getRunningProcess()
}

/**
 * The function `showFeedInFullScreen` displays an image in full-screen mode using a modal with
 * Bootstrap.
 * @param value - The `value` parameter in the `showFeedInFullScreen` function is the URL of the image
 * that you want to display in full screen mode. This URL will be used to set the `src` attribute of
 * the `<img>` tag that displays the image in the full-screen modal.
 */
function showFeedInFullScreen(value) {
  // console.log(value)
  var full_screen_modal = new bootstrap.Modal(document.getElementById("full-screen-modal"));
  const full_screen_image = document.getElementById("full-screen-image")
  full_screen_modal.show()
  let html = ``
  setTimeout(() => {
    html += `
                <img src="${value}" class="w-100 h-100 bg-dark " style="object-fit : contain" />
            `
    full_screen_image.innerHTML = html
  }, 100);

}


//health check functions
var health_modal = new bootstrap.Modal(document.getElementById("livis-health-modal"));


//function to open healthcheck modal
function openhealthModal() {
  toggleHealthCheckType(healtch_check_type)
  health_modal.show();
}

//function to close health check modal
function closeHealthModal() {
  health_modal.hide();
}


//toggle health check type function
function toggleHealthCheckType(type) {
  //////////console.log(type)
  const livis_health_hardware_btn = document.getElementById("livis-health-hardware-btn")
  const livis_health_software_btn = document.getElementById("livis-health-software-btn")
  const livis_health_hardware_list = document.getElementById("livis-health-hardware-list")
  const livis_health_software_list = document.getElementById("livis-health-software-list")
  if (type == 'hardware') {
    livis_health_hardware_btn.classList.add("active-health-check-btn")
    livis_health_software_btn.classList.remove("active-health-check-btn")
    livis_health_software_list.classList.add("d-none")
    livis_health_hardware_list.classList.remove("d-none")
    getHardwarehealthCheck()
    healtch_check_type = 'hardware'
  } else {
    livis_health_hardware_btn.classList.remove("active-health-check-btn")
    livis_health_software_btn.classList.add("active-health-check-btn")
    livis_health_software_list.classList.remove("d-none")
    livis_health_hardware_list.classList.add("d-none")
    getSoftwareHealthCheck()
    healtch_check_type = 'software'

  }
}

/**
 * The function `getSoftwareHealthCheck` retrieves software health check data and dynamically generates
 * HTML content to display the status of different services, including cameras, based on the data
 * received.
 */
function getSoftwareHealthCheck() {

  get("/health_check_soft", (result, msg) => {
    // console.log(result?.data)
    const livis_health_software_list = document.getElementById("livis-health-software-list")
    let html = ``
    for (const key in result?.data) {
      // console.log(key, result?.data[key])
      const value = result?.data[key]
      if (key === 'camera') {
        for (let i = 0; i < value.length; i++) {
          const item = value[i]
          html += `
                    <div class="livis-health-service">
                        <p>Camera ${item?.camera_name}</p> `
          if (item?.running) {

            html += `
                            <img src="../common/image/check-circle-icon.svg" />
                            `
          } else {
            html += `
                            <img src="../common/image/cross-circle-icon.svg" />
                            `
          }
          html += `
                    </div>
                `
        }

      } else {
        html += `
                    <div class="livis-health-service">
                        <p>${key}</p> `
        if (value) {

          html += `
                            <img src="../common/image/check-circle-icon.svg" />
                            `
        } else {
          html += `
                            <img src="../common/image/cross-circle-icon.svg" />
                            `
        }
        html += `
                    </div>
                `
      }
    }
    livis_health_software_list.innerHTML = html
  }, (error, msg) => {
  })
}

function getHardwarehealthCheck() {
  get("/health_check_hard", (result, msg) => {
    // console.log(result?.data)
  }, (error, msg) => {
  })
}

function getInspectFrequency() {
  inspect_frequency = localStorage.getItem('inspection_interval')
}
getInspectFrequency()

function capitalizeFirstLetter(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

window.addEventListener('beforeunload', function (event) {
  if (localStorage.getItem('is_running')) {
    stopinspect()
    end_process_modal.show()
  }
  return 'Are you sure you want to leave this page?';
});
