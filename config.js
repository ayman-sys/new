var plc = []
var camera = []
var inspection_data = {}

/**
 * Fetches inspection station details and updates the UI with PLC and camera details.
 * Displays loading message while fetching data. Updates HTML content for PLC and camera configurations.
 * Disables or enables input fields based on the edit state.
 * Handles errors by showing appropriate messages and updating the UI.
 */
function getInspectionStationDetails() {
    setIsLoading(true, "Please wait until we fetch the configurations")
    const plc_wrap = document.getElementById("plc-list-wrap")
    const details_wrap = document.getElementById("details-list-wrap")
    get('/get_inspection_station_details', (data, msg) => {
        inspection_data = data?.data
        plc = data?.data?.plc
        camera = data?.data?.camera
        //console.log(data, camera, plc)
        let plc_HTML = ``
        let camera_HTML = ``
        let details_HTML = ""
        for (let i = 0; i < plc?.length; i++) {
            plc_HTML += `
                            <div class="row m-0 livis-config-table-content-wrap">
                                <div class="col livis-config-table-content-controller-type">
                                    <div>${plc[i]?.communication_protocol ? plc[i]?.communication_protocol : "--"}</div>
                                    <div>${plc[i]?.plc_name ? plc[i]?.plc_name : "--"}</div>
                                </div>
                                <div class="col  livis-config-table-inputs-wrap d-flex justify-content-center">
                                    <input type="text" id="plc-adress-${i}" value="${plc[i]?.interface_address ? plc[i]?.interface_address : "0.0.0.0"}"  />
                                </div>
                                <div class="col row  livis-config-table-inputs-wrap d-flex justify-content-center">
                                    <div class="col">
                                        <div>
                                            <input type="text" id="plc-register-${i}" value="${plc[i]?.register_value ? plc[i]?.register_value : "00"}" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div>
                                            <input type="text" id="plc-idle-${i}" value="${plc[i]?.idle_value ? plc[i]?.idle_value : "00"}" />
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div>
                                            <input type="text" id="plc-actual-${i}"" value="${plc[i]?.actual_value ? plc[i]?.actual_value : "00"}" />
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
            `

        }
        if (plc?.length === 0) {
            plc_HTML += `
                <div data-i18n="no_plc_details_found" class="livis-no-plc-found">No PLC Details Found</div>
            `
        }


        getCameraDetails()

        if (inspection_data.workstation_name) {
            details_HTML += `
                    
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="workstation_name">Workstation Name</div>
                        <div>${inspection_data?.workstation_name ? inspection_data?.workstation_name : "--"}</div>
                    </div>
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="workstation_location">Workstation Location</div>
                        <div>${inspection_data?.workstation_location ? inspection_data?.workstation_location : "--"}</div>
                    </div>
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="workstation_type">Workstation Type</div>
                        <div>${inspection_data?.workstation_type ? inspection_data?.workstation_type : "--"}</div>
                    </div>
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="use_case_count">Use case Count</div>
                        <div>${inspection_data?.use_case ? inspection_data?.use_case : "--"}</div>
                    </div>
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="inspection_mode">Inspection Mode</div>
                        <div>${inspection_data?.inspection_mode ? inspection_data?.inspection_mode : "--"}</div>
                    </div>
                    <div class="col-md-6 livis-config-table-content-controller-type">
                        <div data-i18n="inspection_type" >Inspection Type</div>
                        <div>${inspection_data?.inspection_type ? inspection_data?.inspection_type : "--"}</div>
                    </div>
                    </div>`
        } else {
            details_HTML += `
                <div data-i18n="no_workstation_details_found" class="livis-no-plc-found">No Workstation Details Found</div>
            `
        }

        details_wrap.innerHTML = details_HTML
        i18n()

        const wrapper = document.getElementById('config-wrap')
        const inputs = wrapper.querySelectorAll('input')
        inputs.forEach(function (input) {

            input.disabled = true;

        });

        const selects = wrapper.querySelectorAll('select')
        selects.forEach(function (input) {

            input.disabled = true;

        });


        setIsLoading(false, "Please wait until we fetch the configurations")

    }, (error, msg) => {
        //console.log(error)
        plc_HTML = `<div data-i18n="no_plc_details_found" class="livis-no-plc-found">No PLC Details Found</div>`
        camera_HTML = `<div data-i18n="no_camera_details_found" class="livis-no-plc-found">No Camera Details Found</div>`
        details_HTML = `<div data-i18n="no_workstation_details_found" class="livis-no-plc-found">No Workstation Details Found</div>`


        plc_wrap.innerHTML = plc_HTML
        i18n()
        camera_wrap.innerHTML = camera_HTML
        i18n()
        details_wrap.innerHTML = details_HTML
        i18n()

        if (msg) {
        } else {
        }
        setIsLoading(false, "Please wait until we fetch the configurations")

    })
}

/**
 * Pings the inspection station and updates the status of PLC and camera connections.
 * Shows success or failure status for each PLC and camera based on the response.
 * Updates the UI with the ping results and handles errors.
 */
async function ping() {
    const user_info = JSON.parse(localStorage.getItem('livis_user_info'))
    //console.log(user_info)
    document.getElementById("ping-text").innerText = await translateIntermediateText('Pinging ...')

    post('/inspection_station/ping', { _id: user_info?.inspection_station_id }, async (data, msg) => {
        let plc_keys = data?.data[1]
        let camera_keys = data?.data[0]

        for (let i = 0; i < Object.keys(plc_keys).length; i++) {
            if (!Object.values(plc_keys)[i]) {
                document.getElementById(`plc-ping-status-${i}`).innerText = await translateIntermediateText('Pinging Failed')
                document.getElementById(`plc-ping-status-${i}`).style.color = '#971717'
            } else {
                document.getElementById(`plc-ping-status-${i}`).innerText = await translateIntermediateText('Pinging Success')
                document.getElementById(`plc-ping-status-${i}`).style.color = '#0E5D27'
            }
        }

        for (let i = 0; i < Object.keys(camera_keys).length; i++) {
            if (!Object.values(camera_keys)[i]) {
                document.getElementById(`camera-ping-status-${i}`).innerText = await translateIntermediateText('Camera Connection Failed')
                document.getElementById(`camera-ping-status-${i}`).style.color = '#971717'

            } else {
                document.getElementById(`camera-ping-status-${i}`).innerText = await translateIntermediateText('Camera Connection Successful')
                document.getElementById(`camera-ping-status-${i}`).style.color = '#0E5D27'

            }
        }
        document.getElementById("ping-text").innerText = await translateIntermediateText('Ping')
        //console.log(data)
    }, (error, msg) => {
        //console.log(error)
        if (msg) {

        } else {

        }
    })
}


/**
 * Handles changes to PLC configuration data.
 * Collects data from input fields, prepares a payload, and sends a PATCH request to update PLC settings.
 * Updates the inspection station details and re-enables editing if successful.
 */
function handlePLCchange(type) {
    setIsLoading(true, "Please wait until the values are updated")
    const input_plc = plc_data[selected_value]['input_controller']
    for (const key in input_plc) {
        if (input_plc.hasOwnProperty(key)) {
            const value = input_plc[key];
            const plc_ip_address = document.getElementById(`plc-adress-${key}`).value
            const register_value = document.getElementById(`plc-register-${key}`).value
            const idle_value = document.getElementById(`plc-idle-${key}`).value
            const actual_value = document.getElementById(`plc-actual-${key}`).value
            const connection_interface = document.getElementById(`plc-interface-${key}`).value
            const plc_communique_type = document.getElementById(`plc-type-${key}`).value


            input_plc[key]['plc_ip_address'] = plc_ip_address
            input_plc[key]['register'] = register_value
            input_plc[key]['idle_value'] = idle_value
            input_plc[key]['actual_value'] = actual_value
            input_plc[key]['connection_interface'] = connection_interface
            input_plc[key]['plc_communique_type'] = plc_communique_type
        }
    }
    const output_plc = plc_data[selected_value]['output_controller']
    for (const key in output_plc) {
        if (output_plc.hasOwnProperty(key)) {
            const value = output_plc[key];
            // console.log(key, value)
            const plc_ip_address = document.getElementById(`plc-adress-${key}`).value
            const register_value = document.getElementById(`plc-register-${key}`).value
            const idle_value = document.getElementById(`plc-idle-${key}`).value
            const actual_value = document.getElementById(`plc-actual-${key}`).value
            const connection_interface = document.getElementById(`plc-interface-${key}`).value
            const plc_communique_type = document.getElementById(`plc-type-${key}`).value


            output_plc[key]['plc_ip_address'] = plc_ip_address
            output_plc[key]['register'] = register_value
            output_plc[key]['idle_value'] = idle_value
            output_plc[key]['actual_value'] = actual_value
            output_plc[key]['connection_interface'] = connection_interface
            output_plc[key]['plc_communique_type'] = plc_communique_type
        }
    }
    let payload = {
        input_controller: input_plc,
        output_controller: output_plc,
        recipe_id: plc_data[selected_value]?.recipe_id
    }

    patch('/update_plc', payload, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            showToast("success", 'Updated successful')
        }
        //console.log(result)
        getInspectionStationDetails()
        getplcDetails()
        editData()
        setIsLoading(false, "Please wait until the values are updated")

    }, (error, msg) => {
        //console.log(error.message)
        if (msg) {
            showToast('danger', msg)
        } else {
            showToast('danger', error.message)
        }
        setIsLoading(false, "Please wait until the values are updated")

    })
}


/**
 * Handles changes to camera configuration data.
 * Collects data from input fields, prepares a payload, and sends a PATCH request to update camera settings.
 * Updates the inspection station details and re-enables editing if successful.
 */

function handleCameraChange() {
    let current_camera_data = camera
    for (let i = 0; i < camera?.length; i++) {
        const value = i
        const camera_address = document.getElementById(`camera-address-${value}`).value
        if (camera_address < 0) {
            showToast('warning', "Camera Address cannot be Negative")
            return
        }
        const camera_type = document.getElementById(`camera-type-${value}`).value
        current_camera_data[value]['camera_address'] = camera_address
        current_camera_data[value]['camera_type'] = camera_type
    }
    // console.log(current_camera_data)
    // return
    let payload = {
        camera: current_camera_data
    }
    patch('/update_inspection_station_details', payload, (result, msg) => {
        if (msg) {
            showToast("success", msg)
        } else {
            showToast("success", 'Updated successful')
        }
        //console.log(result)
        getInspectionStationDetails()
        editData()
    }, (error, msg) => {
        //console.log(error.message)
        if (msg) {
        } else {
        }
    })
}

/**
 * Toggles between edit and view modes for configuration data.
 * Enables or disables input fields and buttons based on the edit state.
 * Updates PLC and camera details and toggles visibility of update buttons.
 */
function editData() {
    getplcDetails()
    getCameraDetails()
    document.getElementById('edit-btn').classList.toggle('active')
    //console.log(document.getElementById('edit-btn').classList.contains('active'))
    const wrapper = document.getElementById('config-wrap')
    const inputs = wrapper.querySelectorAll('input')
    inputs.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });
    const selects = wrapper.querySelectorAll('select')
    selects.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });

    const update_btns = document.querySelectorAll('.update-btn')
    //console.log(update_btns)
    update_btns.forEach(function (btn) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            btn.classList.remove('d-none')
        } else {
            btn.classList.add('d-none')

        }
    })
}


/**
 * Changes the visibility of different configuration menus based on the selected value.
 * Updates the active state of menu icons and adjusts the visibility of corresponding sections.
 */
function changeMenu(value) {
    const plc_menu_icon = document.getElementById("config-menu-plc")
    const plc_menu = document.getElementById("plc-menu")
    const camera_menu_icon = document.getElementById("config-menu-camera")
    const camera_menu = document.getElementById("camera-menu")
    const details_menu_icon = document.getElementById("config-menu-details")
    const details_menu = document.getElementById("details-menu")

    const barcode_menu_icon = document.getElementById("config-menu-barcode")
    const barcode_menu = document.getElementById("barcode-menu")

    const edit_icon = document.getElementById("edit-btn")
    const ping_icon = document.getElementById("ping-btn")
    const plc_recipe_dropdown = document.getElementById("plc-recipe-dropwdown")

    if (value == 'plc') {
        plc_menu_icon.classList.add('active')
        camera_menu_icon.classList.remove('active')
        camera_menu.classList.add('d-none')
        plc_menu.classList.remove('d-none')
        details_menu_icon.classList.remove('active')
        details_menu.classList.add('d-none')
        edit_icon.classList.remove('d-none')
        ping_icon?.classList.remove('d-none')
        plc_recipe_dropdown.classList.remove('d-none')
        barcode_menu_icon.classList.remove('active')
        barcode_menu.classList.add('d-none')
        document.getElementById('barcode-recipe-dropwdown').classList.add('d-none')

    } else if (value == 'camera') {
        plc_menu_icon.classList.remove('active')
        camera_menu_icon.classList.add('active')
        plc_menu.classList.add('d-none')
        camera_menu.classList.remove('d-none')
        details_menu_icon.classList.remove('active')
        details_menu.classList.add('d-none')
        edit_icon.classList.remove('d-none')
        ping_icon?.classList.remove('d-none')
        plc_recipe_dropdown.classList.add('d-none')
        barcode_menu_icon.classList.remove('active')
        barcode_menu.classList.add('d-none')
        document.getElementById('barcode-recipe-dropwdown').classList.add('d-none')

    } else if ((value == 'details')) {
        plc_menu_icon.classList.remove('active')
        camera_menu_icon.classList.remove('active')
        plc_menu.classList.add('d-none')
        camera_menu.classList.add('d-none')
        details_menu_icon.classList.add('active')
        details_menu.classList.remove('d-none')
        edit_icon.classList.add('d-none')
        ping_icon?.classList.add('d-none')
        plc_recipe_dropdown.classList.add('d-none')
        barcode_menu_icon.classList.remove('active')
        barcode_menu.classList.add('d-none')
        document.getElementById('barcode-recipe-dropwdown').classList.add('d-none')
    } else {
        plc_menu_icon.classList.remove('active')
        camera_menu_icon.classList.remove('active')
        plc_menu.classList.add('d-none')
        camera_menu.classList.add('d-none')
        details_menu_icon.classList.remove('active')
        details_menu.classList.add('d-none')
        edit_icon.classList.remove('d-none')
        ping_icon?.classList.add('d-none')
        plc_recipe_dropdown.classList.add('d-none')
        barcode_menu_icon.classList.add('active')
        barcode_menu.classList.remove('d-none')
        document.getElementById('barcode-recipe-dropwdown').classList.remove('d-none')
    }

    document.getElementById('edit-btn').classList.remove('active')
    //console.log(document.getElementById('edit-btn').classList.contains('active'))
    const wrapper = document.getElementById('config-wrap')
    const inputs = wrapper.querySelectorAll('input')
    inputs.forEach(function (input) {
        input.disabled = true;
    });
    const selects = wrapper.querySelectorAll('select')
    selects.forEach(function (input) {
        input.disabled = true;
    });

    const update_btns = document.querySelectorAll('.update-btn')
    //console.log(update_btns)
    update_btns.forEach(function (btn) {
        btn.classList.add('d-none')
    })

}

getInspectionStationDetails()
getAllRecipes()
getAllRecipesBarcode()
//plc dropdown
const dropdown_list = document.getElementById("livis-config-dropdown")
const dropdown_barcode_list = document.getElementById("livis-barcode-dropdown")
var selected_value = ""
var selected_value_barcode = ""
var plc_data = {}
var barcode_data = {}

/**
 * Fetches and populates the dropdown with PLC recipes.
 * Updates the PLC data based on the selected recipe and handles errors.
 */
function getAllRecipes() {
    let html = ``
    get("/get_recipe_with_plc", (result, msg) => {
        // console.log(result)
        data = result?.data
        plc_data = data
        const menus = Object.keys(data)
        selected_value = menus[0]
        getplcDetails()
        for (let i = 0; i < menus.length; i++) {
            html += `
            <option value="${menus[i]}">${menus[i]}</option>

            `
        }
        dropdown_list.innerHTML = html
        i18n()
    }, (error, msg) => {
        if (msg) {
            showToast('danger', msg)
        } else {
            showToast('danger', error.message)
        }
    })
}


/**
 * Fetches the list of all local recipes and populates a dropdown menu with recipe names.
 * Additionally, sets the initial value for barcode selection and calls `getBarcodeDetails` to fetch 
 * and display barcode details for the selected recipe.
 * 
 * This function sends a GET request to the `/get_all_local_recipes` API endpoint. On success, it 
 * updates the dropdown with recipe names and sets the initial barcode selection. On failure, 
 * error messages are handled silently.
 */
function getAllRecipesBarcode() {
    let html = ``
    get("/get_all_local_recipes", (result, msg) => {
        // console.log(result)
        data = result?.data?.recipes_list
        barcode_data = data
        // const menus = Object.keys(data)
        selected_value_barcode = barcode_data[0].recipe_name
        getBarcodeDetails()
        for (let i = 0; i < barcode_data.length; i++) {
            html += `
            <option value="${barcode_data[i].recipe_name}">${barcode_data[i].recipe_name}</option>

            `
        }
        dropdown_barcode_list.innerHTML = html
        i18n()
    }, (error, msg) => {
        if (msg) {
        } else {
        }
    })
}

/**
 * Handles the change event for the PLC dropdown selection.
 * 
 * @param {Event} e - The event object triggered by the dropdown change.
 * 
 * This function updates the global `selected_value` variable with the selected PLC value 
 * and then calls `getplcDetails` to fetch and display details for the selected PLC.
 */
function plcKey(e) {
    selected_value = e.target.value
    getplcDetails()
}

/**
 * Handles the change event for the barcode dropdown selection.
 * 
 * @param {Event} e - The event object triggered by the dropdown change.
 * 
 * This function updates the global `selected_value_barcode` variable with the selected barcode 
 * value and then calls `getBarcodeDetails` to fetch and display details for the selected barcode.
 */
function barcodeKey(e) {
    selected_value_barcode = e.target.value
    getBarcodeDetails()
}

/**
 * Fetches and displays barcode details for the selected recipe.
 * 
 * This function sends a GET request to the `/get_barcode_config_by_recipe/{recipe_id}` API endpoint 
 * using the `recipe_id` of the selected barcode. On success, it updates the HTML to display 
 * the recipe and part barcode details. It also manages input field states based on the edit mode.
 * 
 * If no barcode configuration is found for the selected recipe, it shows a "No barcode set" message.
 * Handles error messages by showing toast notifications.
 */
function getBarcodeDetails() {
    // console.log('getting barcode details');
    const recipe_data = barcode_data.find(item => item.recipe_name === selected_value_barcode)
    // console.log(recipe_data);
    html = ''
    html2 = ''
    get(`/get_barcode_config_by_recipe/${recipe_data.recipe_id}`, (result, msg) => {
        // console.log('barcode config', result.data)
        if (result.data.status != "No document found for the given recipe_id!") {
            document.getElementById('no-barcode-set').classList.add('d-none')
            document.getElementById('barcode-config-page').classList.remove('d-none')
            html += `                          
                                <div class="livis-barcode-listing-wrap">
                                    <div class="row m-0 w-100 justify-content-between align-items-center">
                                        <div class="col">
                                            <div
                                                class="livis-show-current-barocode livis-show-current-barocode-nodecoration">
                                                Recipe Name</div>
                                            <h5 class="mt-3">${result?.data?.recipe_data?.recipe_name}</h5>
                                        </div>
                                        <div
                                            class="col-md-2 d-flex justify-content-center align-items-center flex-column">
                                            <div class="mb-2">Code Value</div>
                                            <div
                                                class="livis-config-table-inputs-wrap d-flex justify-content-center d-flex justify-content-center">
                                                <input type="text" disabled value="${result?.data?.recipe_data?.recipe_code}" id="barcode-entry-code-recipecode-${result?.data?.recipe_data?.recipe_name}"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>`
            for (let item in result?.data?.part_data)
                html2 += `

                                <div class="livis-barcode-listing-wrap mb-3">
                                    <div class="row m-0 w-100 justify-content-between align-items-center">
                                        <div class="col">
                                            <h5 class="mt-0">${result?.data?.part_data[item].part_name}</h5>
                                           <!-- <div
                                                class="livis-show-current-barocode livis-show-current-barocode-nodecoration livis-show-current-barocode-partwise-number">
                                                Part Number 001122</div> -->
                                        </div>
                                        <div
                                            class="col-md-2 d-flex justify-content-center align-items-center flex-column">
                                            <div
                                                class="livis-config-table-inputs-wrap d-flex justify-content-center d-flex justify-content-center">
                                                <input type="text" disabled value="${result?.data?.part_data[item].part_code}" id="barcode-entry-code-partcode-${result?.data?.part_data[item].part_name}"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            `
            document.getElementById("barcode_recipe").innerHTML = html
            document.getElementById("barcode_part").innerHTML = html2
        } else {
            //  console.log('halo');
            document.getElementById('no-barcode-set').classList.remove('d-none')
            document.getElementById('barcode-config-page').classList.add('d-none')
        }

        i18n()
    }, (error, msg) => {
        if (msg) {
            showToast('danger', msg)
        } else {
            showToast('danger', error.message)
        }
    })

    const wrapper = document.getElementById('config-wrap')
    const inputs = wrapper.querySelectorAll('input')
    inputs.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });
    const selects = wrapper.querySelectorAll('select')
    selects.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });
    const update_btns = document.querySelectorAll('.update-btn')
    //console.log(update_btns)
    update_btns.forEach(function (btn) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            btn.classList.remove('d-none')
        } else {
            btn.classList.add('d-none')

        }
    })
}

/**
 * Creates and saves a new barcode structure based on user input.
 * 
 * This function collects data from various input fields, constructs a payload with barcode configuration, 
 * and sends a POST request to the `/create_barcode_structure` API endpoint. On success, it shows a success 
 * toast message, hides the barcode configuration modal, and updates the barcode details.
 * 
 * The payload includes configurations for recipe, part, batch name, and batch size.
 */
function createBarcodeStructure() {
    const recipe_barcode = barcode_data.find(item => item.recipe_name === selected_value_barcode)
    let flag = true
    //console.log('hi', parseInt(document.getElementById('barocde_recipe_start_position').value - 1));
    const payload = {
        recipe_config: {
            barcode_start_position: parseInt(document.getElementById('barocde_recipe_start_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_recipe_start_position').value - 1) : flag = false,
            recipe_name: recipe_barcode.recipe_name,
            barcode_end_position: parseInt(document.getElementById('barocde_recipe_end_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_recipe_end_position').value - 1) : flag = false,
            recipe_id: recipe_barcode.recipe_id
        },
        part_config: {
            barcode_start_position: parseInt(document.getElementById('barocde_part_start_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_part_start_position').value - 1) : flag = false,
            barcode_end_position: parseInt(document.getElementById('barocde_part_end_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_part_end_position').value - 1) : flag = false
        },
        batch_name_config: {
            barcode_start_position: parseInt(document.getElementById('barocde_batch_id_start_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_batch_id_start_position').value - 1) : flag = false,
            barcode_end_position: parseInt(document.getElementById('barocde_batch_id_end_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_batch_id_end_position').value - 1) : flag = false,
            is_auto_batching: document.getElementById('barocde_batch_id_auto_batching').checked
        },
        batch_size_config: {
            barcode_start_position: parseInt(document.getElementById('barocde_batch_size_start_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_batch_size_start_position').value - 1) : flag = false,
            barcode_end_position: parseInt(document.getElementById('barocde_batch_size_end_position').value - 1) >= 0 ? parseInt(document.getElementById('barocde_batch_size_end_position').value - 1) : flag = false,
            default_batch_size: parseInt(document.getElementById("barocde_batch_size_default").value),
        }
    }
    //console.log(payload, flag);
    if (flag) {
        post("/create_barcode_structure", payload, async (result, msg) => {
            showToast('success', 'Barcode Configuration Saved Successfully')
            set_barcode_config_modal.hide()
            getBarcodeDetails()
            handleShowCurrentConfig()
        }, async (err, msg) => {

        })
    } else {
        showToast('warning', "Value cannot be 0 or negative")
    }

}

/**
 * Validates PLC input fields and updates the state of the update button.
 * 
 * @param {HTMLInputElement} e - The input element that triggered the event.
 * @param {string} key - The key or identifier for the PLC input.
 * @param {string} type - The type of the PLC input ('plc_address', 'plc_register', 'plc_actual', or 'plc_idle').
 * 
 * This function checks the validity of the input values based on their type (e.g., IP address, register value) 
 * and enables or disables the update button accordingly. Displays error messages for invalid inputs.
 */
function handleChangePlc(e, key, type) {
    // console.log(e.value, key, type)
    const update_btn = document.getElementById("update-btn")
    let disable_update_button = false
    if (type == 'plc_address') {
        const error_block = document.getElementById(`plc-error-${key}`)
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(e.value)) {
            error_block.classList.add("d-none")
            disable_update_button = false
        } else {
            error_block.classList.remove("d-none")
            disable_update_button = true
        }
    } else if (type == 'plc_register') {
        const error_block = document.getElementById(`plc-register-error-${key}`)
        const value = parseInt(e.value)
        if (isNaN(value) || value < 0) {
            disable_update_button = true
            error_block.classList.remove("d-none")
        } else {
            disable_update_button = false
            error_block.classList.add("d-none")
        }
    } else if (type == 'plc_actual') {
        const error_block = document.getElementById(`plc-actual-error-${key}`)
        const value = parseInt(e.value)
        if (isNaN(value) || value < 0) {
            disable_update_button = true
            error_block.classList.remove("d-none")
        } else {
            disable_update_button = false
            error_block.classList.add("d-none")
        }
    } else if (type == 'plc_idle') {
        const error_block = document.getElementById(`plc-idle-error-${key}`)
        const value = parseInt(e.value)
        if (isNaN(value) || value < 0) {
            disable_update_button = true
            error_block.classList.remove("d-none")
        } else {
            disable_update_button = false
            error_block.classList.add("d-none")
        }
    }
    // console.log(disable_update_button, update_btn)
    if (disable_update_button) {
        update_btn.style.pointerEvents = "none";
        update_btn.style.opacity = "0.5";
    } else {
        update_btn.style.pointerEvents = "";
        update_btn.style.opacity = "1";
    }

}


/**
 * Fetches and displays camera details.
 * 
 * This function generates and updates the HTML for the camera list based on the `camera` data array. 
 * It includes details like camera name, address, type, and a ping button. If no cameras are found, 
 * it displays a "No Camera Details Found" message.
 * 
 * Handles the visibility of the ping button based on the selected camera type and updates the placeholder 
 * text for the camera address input field based on the selected camera type.
 */
function getCameraDetails() {
    const camera_wrap = document.getElementById("camera-list-wrap")
    let camera_HTML = ''
    for (let i = 0; i < camera?.length; i++) {
        camera_HTML += `
                        <div class="row m-0 livis-config-table-content-wrap">
                            <div class="col-md-3 livis-config-table-content-controller-type d-flex align-items-center justify-content-start">
                                <p class="livis-camera-config-name m-0 ">${camera[i].camera_name ? camera[i].camera_name : "--"}</p>
                                
                            </div>
                            <div class="col-md-5  livis-config-table-inputs-wrap d-flex justify-content-center d-flex justify-content-center">
                                <input type="text" id="camera-address-${i}" value="${camera[i]?.camera_address ? camera[i]?.camera_address : "--"}" />
                            </div>
                            <div class="col-md-4 livis-config-table-inputs-wrap d-flex justify-content-center">
                                <select id="camera-type-${i}" class="custom-select" onchange="checkPingButtonShow(this,${i})">
                                    <option data-i18n="usb_camera" value="USB Camera" ${camera[i]?.camera_type === 'USB Camera' ? 'selected' : ''}>USB Camera</option>
                                    <option data-i18n="ip_cam" value="IP Cam" ${camera[i]?.camera_type === 'IP Cam' ? 'selected' : ''}>IP Cam</option>
                                    <option data-i18n="gig_baumer" value="GIG-E (Baumer)" ${camera[i]?.camera_type === 'GIG-E (Baumer)' ? 'selected' : ''}>GIG-E (Baumer)</option>
                                    <option data-i18n="file_system" value="File System" ${camera[i]?.camera_type === 'File System' ? 'selected' : ''}>File System</option>

                                </select>
                            </div>

                            <div class="col-md-12 row justify-content-between mt-3 p-0 m-0">
                                <div class="justify-content-end d-flex align-items-center">
                                    <div class="col text-end me-3" id="camera-ping-status-${i}">
                                    </div>

                                    <button data-i18n="ping" class="btn btn-primary ping-btn ${camera[i]?.camera_type === 'File System' ? 'd-none' : ''}" onclick="pingCamera('${i}')" id="ping-camera-btn-${i}" >
                                        Ping
                                    </button>
                                </div>
                            </div>
                        </div>
        `
    }
    if (camera?.length === 0) {
        camera_HTML += `
            <div data-i18n="no_camera_details_found" class="livis-no-plc-found">No Camera Details Found</div>
        `
    }

    camera_wrap.innerHTML = camera_HTML
    i18n()
}


/**
 * Toggles the visibility of the ping button and updates the camera address input placeholder.
 * 
 * @param {HTMLSelectElement} selectedOption - The select element that triggered the change event.
 * @param {number} index - The index of the selected camera in the list.
 * 
 * This function shows or hides the ping button based on the selected camera type and updates the 
 * placeholder text for the camera address input field to guide the user on the expected format.
 */
function checkPingButtonShow(selectedOption, index) {
    //console.log(selectedOption.value, index)
    if (selectedOption.value === "File System")
        document.getElementById("ping-camera-btn-" + index).classList.add('d-none')
    else
        document.getElementById("ping-camera-btn-" + index).classList.remove('d-none')

    const camera_input_address_field = document.getElementById(`camera-address-${index}`)
    camera_input_address_field.value = ''
    if (selectedOption.value === 'USB Camera')
        camera_input_address_field.placeholder = '0 or 1 or 2'
    if (selectedOption.value === "File System")
        camera_input_address_field.placeholder = '/home/user/Documents/image_path'
    if (selectedOption.value.includes("GIG-E"))
        camera_input_address_field.placeholder = '192.168.x.x'
    if (selectedOption.value.includes("IP"))
        camera_input_address_field.placeholder = 'rtsp://<address>:<port>/Streaming/Channels/<id>'

}


/**
 * Fetches and displays PLC details for the selected PLC.
 * 
 * This function generates and updates the HTML for both input and output PLC lists based on `plc_data`. 
 * It includes details like PLC address, interface, and type. Also manages input field states based on 
 * the edit mode.
 * 
 * Updates the display of PLC configuration details and shows/hides input fields and update buttons 
 * based on the edit mode.
 */
function getplcDetails() {

    const input_plc = plc_data[selected_value]?.input_controller
    const output_plc = plc_data[selected_value]?.output_controller
    const plc_wrap = document.getElementById("plc-list-wrap")
    const plc_output_wrap = document.getElementById("plc-output-list-wrap")
    let plc_HTML = ``
    let plc_output_HTML = ``
    for (const key in input_plc) {
        if (input_plc.hasOwnProperty(key)) {
            const value = input_plc[key];
            // console.log(`Key: ${key}, Value:`, value);
            plc_HTML += `
          <div class="row m-0 livis-config-table-content-wrap">
              <div class="col-md-12 livis-config-table-content-controller-type d-flex justify-content-between">
                   <div>
                    <div>${key ? key : "--"}</div>
                    <div>${value?.plc_id ? value?.plc_id : "--"}</div>
                  </div>
                  <div class="col justify-content-end d-flex align-items-center">
                        <div class="col text-end ping-status me-3" id="plc-ping-status-${key}">
                                                
                        </div>
                      <button data-i18n="ping" class="btn btn-primary ping-btn" id="ping-plc-btn-${key}" onclick="pingPLC('${key}', '${selected_value}', 'input_controller')">
                          Ping
                      </button>
                  </div>
              </div>
              <div class="col-md-12 row  livis-config-table-inputs-wrap d-flex justify-content-center">
                <div class="col-md-4">
                      <div class="d-flex flex-column">
                          <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_address')" id="plc-adress-${key}" value="${value?.plc_ip_address ? value?.plc_ip_address : "0.0.0.0"}" />
                          <small data-i18n="invalid_plc" id="plc-error-${key}" class=" d-none text-danger">Invalid PLC</small>
                      </div>
                  </div>
                  <div class="col-md-4">
                      <div>
                          <select id="plc-interface-${key}" class="custom-select">
                                <option data-i18n="modbus_tcp" value="Modbus TCP" ${value?.connection_interface === 'Modbus TCP' ? 'selected' : ''}>Modbus TCP</option>
                                <option data-i18n="modbus_rtu" value="Modbus RTU" ${value?.connection_interface === 'Modbus RTU' ? 'selected' : ''}>Modbus RTU</option>
                                <option data-i18n="profinet" value="Profinet" ${value?.connection_interface === 'Profinet' ? 'selected' : ''}>Profinet</option>
                                <option data-i18n="socket" value="Socket / TCP" ${value?.connection_interface === 'Socket / TCP' ? 'selected' : ''}>Socket / TCP</option>
                                <option data-i18n="serial_communication" value="Serial Communication" ${value?.connection_interface === 'Serial Communication' ? 'selected' : ''}>Serial Communication</option>
                            </select>
                      </div>
                  </div>
                  <div class="col-md-4">
                    <div>
                        <select id="plc-type-${key}" class="custom-select">
                            <option data-i18n="inbound" value="inbound" ${value?.connection_interface === 'inbound' ? 'selected' : ''}>inbound</option>
                            <option data-i18n="bound" value="outbound" ${value?.connection_interface === 'outbound' ? 'selected' : ''}>outbound</option>
                        </select>
                    </div>
                    </div>
              </div>
              <div class="col-md-12 row  livis-config-table-inputs-wrap d-flex justify-content-center mt-3">
                <div class="col-md-4">
                        <div class="d-flex flex-column">
                            <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_register')" id="plc-register-${key}" value="${value?.register ? value?.register : "00"}" />
                            <small data-i18n="value_can_only_be_number" id="plc-register-error-${key}" class=" d-none text-danger">Value can only be number</small>
                        </div>
                    </div>
                    <div class="col-md-4">  
                        <div class="d-flex flex-column">
                            <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_idle')" id="plc-idle-${key}" value="${value?.idle_value ? value?.idle_value : "00"}" />
                            <small data-i18n="value_can_only_be_number" id="plc-idle-error-${key}" class=" d-none text-danger">Value can only be number</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex flex-column">
                            <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_actual')" id="plc-actual-${key}" value="${value?.actual_value ? value?.actual_value : "00"}" />
                            <small data-i18n="value_can_only_be_number" id="plc-actual-error-${key}" class=" d-none text-danger">Value can only be number</small>
                        </div>
                    </div>
              </div>
          </div>
`
        }
    }

    plc_wrap.innerHTML = plc_HTML
    i18n()



    for (const key in output_plc) {
        if (output_plc.hasOwnProperty(key)) {
            const value = output_plc[key];
            // console.log(`Key: ${key}, Value:`, value);
            plc_output_HTML += `
            <div class="row m-0 livis-config-table-content-wrap">
                <div class="col-md-12 livis-config-table-content-controller-type d-flex justify-content-between">
                     <div>
                      <div>${key ? key : "--"}</div>
                      <div>${value?.plc_id ? value?.plc_id : "--"}</div>
                    </div>
                    <div class="col justify-content-end d-flex align-items-center">
                          <div class="col text-end ping-status me-3" id="plc-ping-status-${key}">
                                                  
                          </div>
                        <button data-i18n="ping" class="btn btn-primary ping-btn" id="ping-plc-btn-${key}" onclick="pingPLC('${key}', '${selected_value}', 'input_controller')">
                            Ping
                        </button>
                    </div>
                </div>
                <div class="col-md-12 row  livis-config-table-inputs-wrap d-flex justify-content-center">
                  <div class="col-md-4">
                        <div class="d-flex flex-column">
                            <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_address')" id="plc-adress-${key}" value="${value?.plc_ip_address ? value?.plc_ip_address : "0.0.0.0"}" />
                            <small data-i18n="invalid_plc" id="plc-error-${key}" class=" d-none text-danger">Invalid PLC</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div>
                            <select id="plc-interface-${key}" class="custom-select">
                                  <option data-i18n="modbus_tcp" value="Modbus TCP" ${value?.connection_interface === 'Modbus TCP' ? 'selected' : ''}>Modbus TCP</option>
                                  <option data-i18n="modbus_rtu" value="Modbus RTU" ${value?.connection_interface === 'Modbus RTU' ? 'selected' : ''}>Modbus RTU</option>
                                  <option data-i18n="profinet" value="Profinet" ${value?.connection_interface === 'Profinet' ? 'selected' : ''}>Profinet</option>
                                  <option data-i18n="socket" value="Socket / TCP" ${value?.connection_interface === 'Socket / TCP' ? 'selected' : ''}>Socket / TCP</option>
                                  <option data-i18n="serial_communication" value="Serial Communication" ${value?.connection_interface === 'Serial Communication' ? 'selected' : ''}>Serial Communication</option>
                              </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                      <div>
                          <select id="plc-type-${key}" class="custom-select">
                              <option data-i18n="inbound" value="inbound" ${value?.connection_interface === 'inbound' ? 'selected' : ''}>inbound</option>
                              <option data-i18n="bound" value="bound" ${value?.connection_interface === 'bound' ? 'selected' : ''}>bound</option>
                          </select>
                      </div>
                      </div>
                </div>
                <div class="col-md-12 row  livis-config-table-inputs-wrap d-flex justify-content-center mt-3">
                  <div class="col-md-4">
                          <div class="d-flex flex-column">
                              <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_register')" id="plc-register-${key}" value="${value?.register ? value?.register : "00"}" />
                              <small data-i18n="value_can_only_be_number" id="plc-register-error-${key}" class=" d-none text-danger">Value can only be number</small>
                          </div>
                      </div>
                      <div class="col-md-4">  
                          <div class="d-flex flex-column">
                              <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_idle')" id="plc-idle-${key}" value="${value?.idle_value ? value?.idle_value : "00"}" />
                              <small data-i18n="value_can_only_be_number" id="plc-idle-error-${key}" class=" d-none text-danger">Value can only be number</small>
                          </div>
                      </div>
                      <div class="col-md-4">
                          <div class="d-flex flex-column">
                              <input type="text" oninput="handleChangePlc(this, '${key}', 'plc_actual')" id="plc-actual-${key}" value="${value?.actual_value ? value?.actual_value : "00"}" />
                              <small data-i18n="value_can_only_be_number" id="plc-actual-error-${key}" class=" d-none text-danger">Value can only be number</small>
                          </div>
                      </div>
                </div>
            </div>
  `
        }
    }

    plc_output_wrap.innerHTML = plc_output_HTML
    i18n()

    const wrapper = document.getElementById('config-wrap')
    const inputs = wrapper.querySelectorAll('input')
    inputs.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });
    const selects = wrapper.querySelectorAll('select')
    selects.forEach(function (input) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            input.disabled = false;
        } else {
            input.disabled = true;
        }
    });
    const update_btns = document.querySelectorAll('.update-btn')
    //console.log(update_btns)
    update_btns.forEach(function (btn) {
        if (document.getElementById('edit-btn').classList.contains('active')) {
            btn.classList.remove('d-none')
        } else {
            btn.classList.add('d-none')

        }
    })
}

/**
 * Sends a request to ping a PLC (Programmable Logic Controller) to check its connectivity status.
 * 
 * @param {string} key - The unique key for the PLC configuration.
 * @param {string} selectedValue - The selected value for the PLC.
 * @param {string} type - The type of PLC configuration.
 * 
 * This function gathers PLC configuration details from input fields, constructs a payload, and sends 
 * a POST request to the `/check_plc` API endpoint. It updates the button text and style based on 
 * the pinging status and displays the connectivity result (Connected/Not Connected) in the UI.
 */
async function pingPLC(key, selectedValue, type) {
    // console.log(key, selectedValue, type, plc_data[selectedValue][type][key])

    const plc_ip_address = document.getElementById(`plc-adress-${key}`).value
    const register_value = document.getElementById(`plc-register-${key}`).value
    const idle_value = document.getElementById(`plc-idle-${key}`).value
    const actual_value = document.getElementById(`plc-actual-${key}`).value
    const connection_interface = document.getElementById(`plc-interface-${key}`).value
    const plc_communique_type = document.getElementById(`plc-type-${key}`).value
    let payload = {
        plc_ip_address: plc_ip_address,
        register: register_value,
        idle_value: idle_value,
        actual_value: actual_value,
        connection_interface: connection_interface,
        plc_communique_type: plc_communique_type
    }
    if (!payload) return
    const ping_btn = document.getElementById(`ping-plc-btn-${key}`)
    ping_btn.innerText = await translateIntermediateText("Pinging...")
    ping_btn.style.pointerEvents = "none"
    ping_btn.style.opacity = "0.8"
    post("/check_plc", payload, async (result, msg) => {
        // console.log(result)
        ping_btn.innerText = await translateIntermediateText("Ping")
        ping_btn.style.pointerEvents = ""
        ping_btn.style.opacity = "1"
        if (!result?.data?.status) {
            document.getElementById(`plc-ping-status-${key}`).innerText = await translateIntermediateText('Not Connected')
            document.getElementById(`plc-ping-status-${key}`).style.color = '#971717'
        } else {
            document.getElementById(`plc-ping-status-${key}`).innerText = await translateIntermediateText('Connected')
            document.getElementById(`plc-ping-status-${key}`).style.color = '#0E5D27'
        }
    }, async (err, msg) => {
        document.getElementById(`plc-ping-status-${i}`).innerText = await translateIntermediateText('Not Connected')
        document.getElementById(`plc-ping-status-${i}`).style.color = '#971717'
    })

}

/**
 * Sends a request to ping a camera to check its connectivity status.
 * 
 * @param {number} i - The index of the camera to ping.
 * 
 * This function collects camera configuration details from input fields, constructs a payload, and sends 
 * a POST request to the `/check_camera` API endpoint. It updates the button text and style based on 
 * the pinging status and displays the connectivity result (Connected/Not Connected) in the UI.
 */
async function pingCamera(i) {
    const camera_address = document.getElementById(`camera-address-${i}`).value
    const camera_type = document.getElementById(`camera-type-${i}`).value
    payload = {
        camera_address, camera_type
    }
    // console.log(payload)
    // return
    const ping_btn = document.getElementById(`ping-camera-btn-${i}`)
    ping_btn.innerText = await translateIntermediateText("Pinging...")
    ping_btn.style.pointerEvents = "none"
    ping_btn.style.opacity = "0.8"
    post("/check_camera", payload, async (result, msg) => {
        // console.log(result)
        ping_btn.innerText = await translateIntermediateText("Ping")
        ping_btn.style.pointerEvents = ""
        ping_btn.style.opacity = "1"
        if (!result?.data?.status) {
            document.getElementById(`camera-ping-status-${i}`).innerText = await translateIntermediateText('Not Connected')
            document.getElementById(`camera-ping-status-${i}`).style.color = '#971717'
        } else {
            document.getElementById(`camera-ping-status-${i}`).innerText = await translateIntermediateText('Connected')
            document.getElementById(`camera-ping-status-${i}`).style.color = '#0E5D27'
        }
    }, async (err, msg) => {
        document.getElementById(`camera-ping-status-${i}`).innerText = await translateIntermediateText('Not Connected')
        document.getElementById(`camera-ping-status-${i}`).style.color = '#971717'
    })

}

/**
 * Fetches and displays a list of available USB cameras.
 * 
 * This function sends a GET request to the `/get_all_available_usbcamera_indexes` API endpoint. 
 * It updates the UI with camera indices and images. If no cameras are found, it displays an error message.
 */
const checkAllCameras = () => {
    const camera_list = document.getElementById("camera-check-list")
    let html = ``
    setIsLoading(true, "Checking for cameras...")
    get("/get_all_available_usbcamera_indexes", async (result, msg) => {
        const response = result?.data
        for (const key in response) {
            // console.log(key, response[key])
            html +=
                `
                <div class="col-md-3 col-lg-3 col-sm-6 d-flex justify-content-center align-items-center">
                    <div>
                        <p class="mb-0">Index : ${key}</p>
                        <img src=${response[key]} height=200 class="rounded"/>
                    </div>
                </div>
            `
        }
        camera_list.innerHTML = html
        i18n()
        setIsLoading(false, "Checking for camera")
    }, async (err, msg) => {
        camera_list.innerText = await translateIntermediateText('Couldnt test the cameras')
        setIsLoading(false, "Checking for camera")

    })

}




// barcode functions 

var part_data = []

const current_batch_config_modal = new bootstrap.Modal(document.getElementById("current-batch-config-modal"))

// current_batch_config_modal.show()

const set_barcode_config_modal = new bootstrap.Modal(document.getElementById("set-barcode-config-modal"))

// set_barcode_config_modal.show()
const handlebusinesslogicChange =()=>{
    const business_logic = document.getElementById("business_logic");
    
}

/**
 * Handles changes to barcode configuration and saves the updated configuration.
 * 
 * This function collects data from various barcode-related input fields and sends a POST request 
 * to the `/set_auto_deployement_barcode_configuration` API endpoint to save the barcode configuration. 
 * Displays a success toast message and updates the barcode details upon successful saving.
 */
const handleBarcodeChange = () => {
    const inputs = document.querySelectorAll('input[id*="barcode-entry-code"]');
    const inputsrecipe = document.querySelectorAll('input[id*="barcode-entry-code-recipecode"]');
    const inputspart = document.querySelectorAll('input[id*="barcode-entry-code-partcode"]');
    //console.log(inputsrecipe);
    // console.log(inputspart);
    const get_barcode_config_by_recipe = barcode_data.find(item => item.recipe_name === selected_value_barcode)
    get(`/get_barcode_config_by_recipe/${get_barcode_config_by_recipe.recipe_id}`, (result, msg) => {
        // console.log('barcode config', result.data)
        const payload = {
            recipe_data: {
                recipe_code: inputs_recipe[0].value,
                recipe_id: result.data.recipe_data.recipe_id,
                recipe_name: result.data.recipe_data.recipe_name,
                barcode_start_position: result.data.recipe_data.barcode_start_position ? result.data.recipe_data.barcode_start_position : 0,
                barcode_end_position: result.data.recipe_data.barcode_end_position ? result.data.recipe_data.barcode_end_position : 0
            },
            part_data: [

            ]
        }
        for (let i in result.data.part_data) {
            //  console.log(i);
            payload.part_data.push({
                part_code: inputs_part[i].value,
                part_name: result.data.part_data[i].part_name,
                part_index: result.data.part_data[i].part_index,
                barcode_start_position: result.data.part_data[i].barcode_start_position,
                barcode_end_position: result.data.part_data[i].barcode_end_position
            })
        }
        // console.log(payload);
        post("/set_auto_deployement_barcode_configuration", payload, async (result, msg) => {
            showToast('success', 'Barcode Configuration Saved Successfully')
            getBarcodeDetails()
            editData()
        }, async (err, msg) => {

        })
        i18n()
    }, (error, msg) => {
        if (msg) {
            showToast('danger', msg)
        } else {
            showToast('danger', error.message)
        }
    })

}

/**
 * Creates a barcode format string for display.
 * 
 * @param {number} startPosition - The starting position of the barcode.
 * @param {number} endPosition - The ending position of the barcode.
 * @param {number} index - The index of the barcode format.
 * @param {string} [elementid=''] - Optional element ID to update with the generated barcode format.
 * 
 * Generates a string of 'X's representing the barcode format based on the start and end positions.
 * If an `elementid` is provided, updates the inner HTML of the specified element with the generated format.
 * 
 * @returns {string} The generated barcode format HTML string.
 */
function createBarcodeFormat(startPosition, endPosition, index, elementid = '') {
    let html = ''

    for (let i = 0; i <= (endPosition - startPosition); i++)
        html += 'X'

    if (endPosition - startPosition == 0)
        html += ' '
    if (elementid != '')
        document.getElementById(elementid).innerHTML = `${index}.` + html
    html += `<div class="livis-config-xx-line"></div>
            <div class="livis-config-xx-number">${index}</div>`
    return html
}

/**
 * Fetches and displays the current barcode configuration.
 * 
 * This function sends a GET request to the `/get_barcode_structure/{barcode_id}` API endpoint to 
 * retrieve and display the current barcode configuration for recipes, parts, batch IDs, and batch sizes. 
 * Displays the configuration details in a modal.
 */
const handleShowCurrentConfig = () => {
    const get_barcode_config_by_recipe = barcode_data.find(item => item.recipe_name === selected_value_barcode)
    get(`/get_barcode_structure/${get_barcode_config_by_recipe._id}`, async (result, msg) => {

        document.getElementById('show-current-barcode-recipie-format').innerHTML = createBarcodeFormat(result.data.data.recipe_config.barcode_start_position, result.data.data.recipe_config.barcode_end_position, 1, 'barcode-config-recipe-show')
        document.getElementById('show-current-barcode-part-format').innerHTML = createBarcodeFormat(result.data.data.part_config.barcode_start_position, result.data.data.part_config.barcode_end_position, 2, 'barcode-config-part-show')
        document.getElementById('show-current-barcode-batchId-format').innerHTML = createBarcodeFormat(result.data.data.batch_name_config.barcode_start_position, result.data.data.batch_name_config.barcode_end_position, 3, 'barcode-config-batchId-show')
        document.getElementById('show-current-barcode-batchSize-format').innerHTML = createBarcodeFormat(result.data.data.batch_size_config.barcode_start_position, result.data.data.batch_size_config.barcode_end_position, 4, 'barcode-config-batchSize-show')
        current_batch_config_modal.show()


    }, async (err, msg) => {
        set_barcode_config_modal.hide()

    })
}


/**
 * Displays the modal for setting a new barcode configuration.
 * 
 * This function retrieves all recipes and shows the barcode configuration modal for setting up a new barcode configuration.
 */
const handleSetBarcode = () => {
    getAllRecipes()
    set_barcode_config_modal.show()
}

/**
 * Fetches and displays the barcode configuration for editing.
 * 
 * This function sends a GET request to the `/get_barcode_structure/{barcode_id}` API endpoint to 
 * retrieve the current barcode configuration for editing. Updates the form fields with the retrieved 
 * configuration data and shows the barcode configuration modal.
 */
const handleBarcodeEdit = () => {
    // console.log(barcode_data.find(item => item.recipe_name === selected_value_barcode))
    const get_barcode_config_by_recipe = barcode_data.find(item => item.recipe_name === selected_value_barcode)
    get(`/get_barcode_structure/${get_barcode_config_by_recipe._id}`, async (result, msg) => {
        document.getElementById('barocde_recipe_start_position').value = result.data.data.recipe_config.barcode_start_position + 1 ? result.data.data.recipe_config.barcode_start_position + 1 : 0
        document.getElementById('barocde_recipe_end_position').value = result.data.data.recipe_config.barcode_end_position ? result.data.data.recipe_config.barcode_end_position + 1 : 0
        document.getElementById('barocde_part_start_position').value = result.data.data.part_config.barcode_start_position ? result.data.data.part_config.barcode_start_position + 1 : 0
        document.getElementById('barocde_part_end_position').value = result.data.data.part_config.barcode_end_position ? result.data.data.part_config.barcode_end_position + 1 : 0
        document.getElementById('barocde_batch_id_start_position').value = result.data.data.batch_name_config.barcode_start_position ? result.data.data.batch_name_config.barcode_start_position + 1 : 0
        document.getElementById('barocde_batch_id_end_position').value = result.data.data.batch_name_config.barcode_end_position ? result.data.data.batch_name_config.barcode_end_position + 1 : 0
        document.getElementById('barocde_batch_id_auto_batching').checked = result.data.data.batch_name_config.is_auto_batching ? result.data.data.batch_name_config.is_auto_batching : false
        document.getElementById('barocde_batch_size_start_position').value = result.data.data.batch_size_config.barcode_start_position ? result.data.data.batch_size_config.barcode_start_position + 1 : 0
        document.getElementById('barocde_batch_size_end_position').value = result.data.data.batch_size_config.barcode_end_position ? result.data.data.batch_size_config.barcode_end_position + 1 : 0
        document.getElementById("barocde_batch_size_default").value = result.data.data.batch_size_config.default_batch_size ? result.data.data.batch_size_config.default_batch_size : 9090
        set_barcode_config_modal.show()

    }, async (err, msg) => {
        set_barcode_config_modal.hide()

    })
}

/**
 * Handles the form submission for barcode configuration.
 * 
 * @param {Event} e - The form submission event.
 * 
 * This function prevents the default form submission behavior, collects all form values into an object, 
 * and logs the form data. Can be extended to include additional form submission logic.
 */
const handleSubmitConfiguration = (e) => {
    e.preventDefault();  // Prevent the default form submission

    // Create an empty object to hold the form values
    const form_data = {};

    // Loop through the form elements
    Array.from(e.target.elements).forEach(element => {
        if (element.name) {
            form_data[element.name] = element.value;  // Add the form element's value to the form_data object
        }
    });

    // console.log(formData);  // Log the formData object
};


/**
 * Handles changes to the selected recipe.
 * 
 * @param {Event} e - The change event triggered by selecting a recipe.
 * 
 * This function logs the selected recipe value. Can be extended to include additional logic based on 
 * recipe selection changes.
 */
const handleChangeRecipe = (e) => {
    // console.log(e.target.value)
}


/**
 * Handles changes to the barcode part configuration.
 * 
 * This function currently does not have any logic implemented but serves as a placeholder for handling
 * changes to barcode part configurations.
 */
const handleChangeBarcodePart = () => {

}

