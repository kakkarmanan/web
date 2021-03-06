// Dependencies
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { get, map, isEmpty } from "lodash";
import classNames from "classnames";
import {
    Alert,
    Card,
    CardHeader,
    CardBody,
    FormGroup,
    Form,
    Container,
    Row,
    Col
} from "reactstrap";

// Config
import { config } from "../../../../config";

// Components
import CustomButton from "../../../../components/CustomButton";
import UserProfileEditPageData from "./UserProfileEditPageData";

// User Profile Edit Controller
import UserProfileEditController from "./UserProfileEditController";

// Redux Actions
import { setUser } from "../../../../redux/actions";

// API
import APIFetch from "../../../../util/APIFetch";
import UserProfileEditAPI from "./UserProfileEditAPI";

// Form
import FormHandler from "../../../../util/FormHandler";
import ValidateInput from "../../../../util/ValidateInput";
import Input from "../../../../components/Form/Input";
import UserProfileEditForm from "./UserProfileEditForm.json";

/**
 * User Profile View
 *
 * Get the user's profile information from FusionAuth.
 *
 * @param {Function} setUser Redux action to set the user.
 * @param {String} locale The current locale of the application.
 * @param {Object} languageData Current language information for the app. Language data object.
 */
const UserProfileView = ({ setUser, locale, languageData }) => {
    // Setup Initial State
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState(false);
    const [submittingForm, setSubmittingForm] = useState(false);
    const [formAlert, setFormAlert] = useState({ type: null });

    // Setup the API Fetch utility for the User Profile Edit form submit.
    const [{ fetchResults }] = APIFetch({
        locale,
        BASEURL: config.apiServer.BASEURL,
        PATH_SEARCH: UserProfileEditAPI.apiService.putProfile.PATH_SEARCH,
        PATH_METHOD: UserProfileEditAPI.apiService.putProfile.PATH_METHOD,
        formData
    });

    // Setup the API Fetch utility for the User Profile Edit View..
    const [{ isLoading, results, hasError }] = APIFetch({
        locale,
        BASEURL: config.apiServer.BASEURL,
        PATH_SEARCH: UserProfileEditAPI.apiService.getProfile.PATH_SEARCH,
        PATH_METHOD: UserProfileEditAPI.apiService.getProfile.PATH_METHOD,
        formData
    });

    // Profile data for edit form.
    const profileData = get(results, ["data", "content"]);

    // Make sure formData is empty and profileData is not empty to prevent multiple re-renders.
    if (isEmpty(formData) && !isEmpty(profileData)) {
        // Map over the result data.
        map(profileData, (value, key) => {
            // Only grab the information that we want.
            if (["firstName", "lastName", "email", "username", "mobilePhone"].includes(key)) {
                // Update the formData state.
                setFormData(prevState => {
                    return {
                        ...prevState,
                        [key]: {
                            ...formData[key],
                            value,
                            error: false,
                            errorText: "",
                            validText: ""
                        }
                    }
                });
            }
        });
    }

    /**
     * Handle input changes
     *
     * Update the formData object to hold the newest value for an input
     * when the value is changed. This is done so we can have a single source
     * of truth for the inputs.
     *
     * @param {object} target Event object that executed the function.
     */
    const handleInputChange = ({ target }) => {
        // Check if the input type is of a phone type, and make sure we only allow numbers
        // to be entered to the input.
        if (target.type === "tel" && !Number.isInteger(Number.parseInt(target.value))) {
            // Return so that non-numbers are not entered.
            return;
        }

        // Update state with new value for the input.
        setFormData({
            ...formData,
            [target.name]: {
                ...formData[target.name],
                value: target.value
            }
        });
    };

    /**
     * Handle User Profile Edit Actions
     *
     * Used to efficiently handle responses from the User Profile
     * Edit requests to either redirect the user or to display a
     * message to the user.
     *
     * @param {Object} responseObj Response object from the request.
     * @param {Object} data Data object required for handling the action.
     */
    const handleResponseAction = (responseObj, data) => {
        // Handle appropriate actions with the User 2Factor Enable controller.
        const response = UserProfileEditController.handleAction(responseObj, data, setUser);

        // Check if there is a response to be handled.
        if (response) {
            // Set the form alert information.
            setFormAlert(response);
        }
    };

    /**
     * Handle form submit
     *
     * We need to be able to handle the form submit which can only by done by watching
     * for state changes in `submittingForm` and `formErrors`.
     */
    useEffect(() => {
        // Set a variable so we can cancel the request if needed (ex, user
        // moves to a new page).
        let didCancel = false;

        /**
         * Handles form submit.
         */
        const submitForm = async () => {
            if (!didCancel && submittingForm && !formErrors) {
                try {
                    // Send the API request.
                    const response = await fetchResults(formData);

                    // Determine what to do with the user based on the success response from the API service.
                    const userProfileEditResponse = await UserProfileEditController.handleResponse(response, languageData);

                    // Handle the result from the User Profile Edit request.
                    handleResponseAction(userProfileEditResponse, response.data);
                } catch (error) {
                    // Make sure we don't try to change state after re-render.
                    if (!didCancel) {
                        // Error will have a type if the result is from the User 2Factor Enable Controller.
                        if (get(error, "type")) {
                            // Update the UI with the form error.
                            setFormAlert({ type: error.type, content: error.content });
                        } else {
                            // Update the UI with the form error.
                            setFormAlert({ type: "danger", content: error.data.message });
                        }

                        // Reset the form submit state.
                        setSubmittingForm(false);
                    }
                }
            } else {
                // Make sure we don't try to change state after re-render.
                if (!didCancel) {
                    // Reset the form submit state.
                    setSubmittingForm(false);
                }
            }
        }

        // Call the submitForm function to handle the form's submit action.
        submitForm();

        /**
         * Perform action when the component is unmounted
         *
         * The return function in useEffect is equivalent to componentWillUnmount and
         * can be used to cancel the API request.
         */
        return () => {
            // Set the canceled variable to true.
            didCancel = true;
        };

        // eslint-disable-next-line
    }, [submittingForm, formErrors]);

    /**
     * Form Submit Handler
     *
     * Performs a request to the API Serivce upon form submittal. This
     * will attempt to save the user's profile.
     *
     * @param {object} e Form object that executed the function.
     */
    const handleFormSubmit = async e => {
        // Pervent the form from redirecting the user.
        e.preventDefault();

        // Set Form errors to false to reset the state.
        setFormErrors(false);
        // Set submitting form to true so that we can submit it.
        setSubmittingForm(true);
        // Reset the form alert.
        setFormAlert({ type: null });

        // Loop through the form inputs to validate them before submitting the request to the
        // API Service.
        Promise.all(map(UserProfileEditForm, input => (
            validate(get(input, 'name'), ValidateInput(get(formData[get(input, "name")], "value") || "", get(input, "type"), get(input, "validation"), languageData))
        )));
    }

    /**
     * Validate form inputs
     *
     * Perform input validation on form blur and update the `formData` as necessary.
     *
     * @param {String} target Name of the input to set validation info for.
     * @param {Array} error Error list for the input.
     */
    const validate = (target, error) => {
        // Get the values based on error status.
        const { isError, errorText, validText } = FormHandler.validate(["input"], target, error, languageData);

        // If there is an error, set formErrors to true.
        if (isError) {
            setFormErrors(true);
        }

        // Set the form input state based on the results of the error, if it exists or not.
        setFormData(prevState => {
            return {
                ...prevState,
                [target]: {
                    ...formData[target],
                    error: isError,
                    errorText: errorText,
                    validText: validText
                }
            }
        });
    };

    /**
     * Display Form
     *
     * Display elements for the rendered view to be displayed. Extracted
     * to a component function in order to be rendered conditionally.
     */
    const displayForm = () => (
        <Form role="form" onSubmit={ handleFormSubmit } className="col-md-12">
            { formAlert.type &&
                <Alert color={ formAlert.type }>
                    { formAlert.content }
                </Alert>
            }

            <Row>
                { map(UserProfileEditForm, (input, key) => (
                    <Input
                        autoFocus={ key === 0 }
                        key={ get(input, "name") }
                        inputColXL={ get(input, "inputColXL") }
                        inputColMD={ get(input, "inputColMD") }
                        inputColClassName={ get(input, "inputColClassName") }
                        id={ get(input, "id") }
                        name={ get(input, "name") }
                        type={ get(input, "type") }
                        formGroupClassName={ get(input, "formGroupClassName") }
                        label={ get(languageData, ["common", "input", get(input, "name"), "label"]) }
                        labelClassName={ get(input, "labelClassName") }
                        value={ get(formData[get(input, "name")], "value") }
                        placeholder={ get(languageData, ["common", "input", get(input, "name"), "placeholder"]) }
                        onChange={ handleInputChange }
                        handleFormSubmit={ handleFormSubmit }
                        validate={ validate }
                        prependIcon={ get(input, "prependIcon") }
                        inputClassName={ FormHandler.inputStatus(formData, get(input, "name")) }
                        success={ get(formData[get(input, "name")], "validText") }
                        error={ get(formData[get(input, "name")], "errorText") }
                        languageData={ languageData }
                        validation={ get(input, "validation") }
                        pattern={ get(input, "pattern") }
                        maxLength={ get(input, "maxLength") }
                    />
                )) }
            </Row>

            <FormGroup className="text-center">
                <CustomButton text={ get(languageData, ["common", "saveProfile"]) } className="my-3 bg-primary" type="submit" disabled={ submittingForm } />
            </FormGroup>
        </Form>
    );

    // Create a dynamic class name for the panel that will center the text
    // if the result status is not 200.
    const isCenteredText = classNames({
        "mx-auto": isLoading || get(results, "status") !== 200
    });

    // Render the User Profile View.
    return (
        <Container className="mt-5">
            <Row className="mt-5 justify-content-center">
                <Col xl="6" md="12" className="mt-5 mx-auto">
                    <Card className="bg-primary-card">
                        <CardHeader className="d-flex align-items-center">
                            { get(languageData, ["common", "editProfile"]) }
                        </CardHeader>
                        <CardBody className={ isCenteredText }>
                            <UserProfileEditPageData
                                isLoading={ isLoading }
                                results={ results }
                                hasError={ hasError }
                                component={ displayForm }
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

/**
 * Get App State
 *
 * Get the requried state for the component from the Redux store.
 *
 * @param {Object} state Application state from Redux.
 */
const mapStateToProps = state => {
    return {
        locale: state.language.locale,
        languageData: state.language.languageData
    }
}

// Export the User Profile View.
export default connect(mapStateToProps, { setUser })(UserProfileView);
