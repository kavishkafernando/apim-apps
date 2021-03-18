import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import SettingsIcon from '@material-ui/icons/Settings';
import PersonPinCircleOutlinedIcon from '@material-ui/icons/PersonPinCircleOutlined';
import LifeCycleIcon from '@material-ui/icons/Autorenew';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import Tooltip from '@material-ui/core/Tooltip';
import { FormattedMessage } from 'react-intl';
import LaunchIcon from '@material-ui/icons/Launch';
import Alert from 'AppComponents/Shared/Alert';
import Grid from '@material-ui/core/Grid';
import StepConnector from '@material-ui/core/StepConnector';
import ApiContext, { useAPI } from 'AppComponents/Apis/Details/components/ApiContext';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { Link } from 'react-router-dom';
import grey from '@material-ui/core/colors/grey';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import AuthManager from 'AppData/AuthManager';
import Typography from '@material-ui/core/Typography';


const ColorlibConnector = withStyles({
    alternativeLabel: {
        top: 22,
    },
    active: {
        '& $line': {
            backgroundImage:
                'linear-gradient(to left, #50BCEC 50%, #B1D31E 50%)',
        },
    },
    completed: {
        '& $line': {
            backgroundImage:
                'linear-gradient( #B1D31E, #B1D31E)',
        },
    },
    line: {
        height: 3,
        border: 0,
        backgroundColor: '#eaeaf0',
        borderRadius: 1,
    },
})(StepConnector);

const useColorlibStepIconStyles = makeStyles({
    root: {
        backgroundColor: '#ccc',
        zIndex: 1,
        color: '#fff',
        width: 61,
        height: 60,
        display: 'flex',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    active: {
        backgroundImage:
        'radial-gradient(#50BCEC, #E2E2E2 90%)',
    },
    completed: {
        backgroundImage:
        'radial-gradient(#B1D31E, #E2E2E2)',
    },
});

function ColorlibStepIcon(props) {
    const classes = useColorlibStepIconStyles();
    const { active, completed } = props;

    const icons = {
        1: <SettingsIcon />,
        2: <PersonPinCircleOutlinedIcon />,
        3: <DoneAllIcon />,
        4: <LifeCycleIcon />,
    };

    return (
        <div
            className={clsx(classes.root, {
                [classes.active]: active,
                [classes.completed]: completed,
            })}
        >
            {icons[String(props.icon)]}
        </div>
    );
}

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    button: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    iconTrue: {
        display: 'block',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#B1D31E',
        zIndex: 1,
        color: '#fff',
        width: 15,
        height: 15,
        borderRadius: '50%',
    },
    iconFalse: {
        color: '#fff',
        display: 'block',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: grey[500],
        zIndex: 1,
        width: 15,
        height: 15,
        borderRadius: '50%',
    },
}));

function getSteps() {
    return ['Develop', 'Deploy', 'Test', 'Publish'];
}

export default function NewCustomizedStepper() {
    const classes = useStyles();
    const [api, updateAPI] = useAPI();
    const [isUpdating, setUpdating] = useState(false);
    const [deploymentsAvailable, setDeploymentsAvailable] = useState(false);
    const [lifecycleState, setlifecycleState] = useState(null);
    const isEndpointAvailable = api.endpointConfig !== null;
    const isTierAvailable = api.policies.length !== 0;
    const steps = getSteps();


    let activeStep = 0;
    if (api && isEndpointAvailable && !deploymentsAvailable) {
        activeStep = 1;
    } else if (api && !isEndpointAvailable) {
        activeStep = 0;
    } else if (api && isEndpointAvailable && deploymentsAvailable && lifecycleState !== 'Published') {
        activeStep = 3;
    } else if (lifecycleState === 'Published' && api && isEndpointAvailable && deploymentsAvailable) {
        activeStep = 4;
    }

    useEffect(() => {
        api.getLcState(api.id)
            .then((result) => {
                setlifecycleState(result.body.state);
            });
        api.getRevisionsWithEnv(api.isRevision ? api.revisionedApiId : api.id).then((result) => {
            setDeploymentsAvailable(result.body.count > 0);
        });
    }, []);

    /**
 * Update the LifeCycle state of the API
 *
 */
    function updateLCStateOfAPI(apiId, state) {
        setUpdating(true);
        const promisedUpdate = api.updateLcState(apiId, state);
        promisedUpdate
            .then(() => {
                updateAPI()
                    .then()
                    .catch((error) => {
                        if (error.response) {
                            Alert.error(error.response.body.description);
                        } else {
                            Alert.error('Something went wrong while updating the API');
                        }
                        console.error(error);
                    });
                Alert.info('Lifecycle state updated successfully');
            })
            .finally(() => setUpdating(false))
            .catch((errorResponse) => {
                console.log(errorResponse);
                Alert.error(JSON.stringify(errorResponse.message));
            });
    }

    return (
        <div className={classes.root}>
            <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel StepIconComponent={ColorlibStepIcon}>
                            {label === 'Develop' && (
                                <div>
                                    <Grid
                                        container
                                        direction='row'
                                        justify='center'
                                    >
                                        <Grid item>
                                            {api ? (
                                                <CheckIcon className={classes.iconTrue} />
                                            ) : (
                                                <CloseIcon className={classes.iconFalse} />
                                            )}
                                        </Grid>
                                        <Grid item style={{ marginBottom: '3px', marginLeft: '3px' }}>
                                            <Typography variant='h7'>
                                                <FormattedMessage
                                                    id='Apis.Details.Overview.CustomizedStepper.Develop'
                                                    defaultMessage=' Develop'
                                                />
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid
                                        container
                                        direction='row'
                                        alignItems='center'
                                        justify='center'
                                    >
                                        <Grid item>
                                            {isEndpointAvailable ? (
                                                <CheckIcon className={classes.iconTrue} />
                                            ) : (
                                                <CloseIcon className={classes.iconFalse} />
                                            )}
                                        </Grid>
                                        <Grid item style={{ marginBottom: '3px', marginLeft: '3px' }}>
                                            <Typography variant='h7'>
                                                <FormattedMessage
                                                    id='Apis.Details.Overview.CustomizedStepper.Endpoint'
                                                    defaultMessage=' Endpoint'
                                                />
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            <Link to={'/apis/' + api.id + '/endpoints'}>
                                                <LaunchIcon
                                                    style={{ marginLeft: '10px' }}
                                                    color='primary'
                                                    fontSize='small'
                                                />
                                            </Link>
                                        </Grid>
                                    </Grid>
                                </div>
                            )}
                            {label === 'Deploy' && (
                                <Tooltip
                                    title={deploymentsAvailable ? '' : 'Deploy a revision of this API to the Gateway'}
                                    placement='bottom'
                                >
                                    <Grid
                                        container
                                        direction='row'
                                        alignItems='center'
                                        justify='center'
                                    >
                                        <Grid item>
                                            {deploymentsAvailable ? (
                                                <CheckIcon className={classes.iconTrue} />
                                            ) : (
                                                <CloseIcon className={classes.iconFalse} />
                                            )}
                                        </Grid>
                                        <Grid item style={{ marginBottom: '3px', marginLeft: '3px' }}>
                                            <Typography variant='h7'>
                                                <FormattedMessage
                                                    id='Apis.Details.Overview.CustomizedStepper.Deployments'
                                                    defaultMessage=' Deploy'
                                                />
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            {(((api.type !== 'WEBSUB' && !isEndpointAvailable) || !isTierAvailable)
                                            || AuthManager.isNotPublisher() || api.workflowStatus === 'CREATED')
                                                ? (
                                                    <LaunchIcon
                                                        style={{ marginLeft: '10px' }}
                                                        color='default'
                                                        fontSize='small'
                                                    />
                                                ) : (
                                                    <Link to={'/apis/' + api.id + '/deployments'}>
                                                        <LaunchIcon
                                                            style={{ marginLeft: '10px' }}
                                                            color='primary'
                                                            fontSize='small'
                                                        />
                                                    </Link>
                                                )}
                                        </Grid>
                                    </Grid>
                                </Tooltip>
                            )}
                            {label === 'Test' && (
                                <Grid
                                    container
                                    direction='row'
                                    alignItems='center'
                                    justify='center'
                                >
                                    <Grid item>
                                        <Typography variant='h7'>
                                            <FormattedMessage
                                                id='Apis.Details.Overview.CustomizedStepper.Test1'
                                                defaultMessage=' Test'
                                            />
                                        </Typography>
                                    </Grid>
                                    {lifecycleState === 'Published' || !deploymentsAvailable || !isEndpointAvailable
                                        ? (
                                            <LaunchIcon
                                                style={{ marginLeft: '10px' }}
                                                color='default'
                                                fontSize='small'
                                            />
                                        ) : (
                                            <Link to={'/apis/' + api.id + '/deployments'}>
                                                <LaunchIcon
                                                    style={{ marginLeft: '10px' }}
                                                    color='primary'
                                                    fontSize='small'
                                                />
                                            </Link>
                                        )}
                                </Grid>
                            )}
                            {label === 'Publish' && (
                                <div>
                                    {lifecycleState !== 'Published' ? (
                                        <Button
                                            size='small'
                                            variant='contained'
                                            color='primary'
                                            onClick={() => updateLCStateOfAPI(api.id, 'Publish')}
                                            disabled={((api.type !== 'WEBSUB' && !isEndpointAvailable)
                                                || !isTierAvailable)
                                                || !deploymentsAvailable
                                                || api.isRevision || AuthManager.isNotPublisher()
                                                || api.workflowStatus === 'CREATED'}
                                        >
                                            Publish
                                            {isUpdating && <CircularProgress size={20} />}
                                        </Button>
                                    ) : (
                                        <Grid
                                            container
                                            direction='row'
                                            alignItems='center'
                                            justify='center'
                                        >
                                            <Grid item>
                                                <CheckIcon className={classes.iconTrue} />
                                            </Grid>
                                            <Grid item style={{ marginBottom: '3px', marginLeft: '3px' }}>
                                                <Typography variant='h7'>
                                                    <FormattedMessage
                                                        id='Apis.Details.Overview.CustomizedStepper.publish'
                                                        defaultMessage=' Published (Current API)'
                                                    />
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    )}
                                </div>
                            )}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </div>
    );
}

NewCustomizedStepper.propTypes = {
    classes: PropTypes.shape({}).isRequired,
    api: PropTypes.shape({
        id: PropTypes.string,
    }).isRequired,
};

NewCustomizedStepper.contextType = ApiContext;
