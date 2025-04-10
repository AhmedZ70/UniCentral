import os
import sys
import json
import logging
import requests

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('content_moderation_test')

def test_perspective_api(api_key, text="This is a test with a curse word: fuck"):
    """
    Test the Perspective API with detailed logging
    """
    logger.info("Starting Perspective API test")
    logger.info(f"API Key provided: {'YES' if api_key else 'NO'}")
    
    if not api_key:
        logger.error("No API key provided. Please set the PERSPECTIVE_API_KEY environment variable.")
        return False
        
    url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={api_key}"
    logger.info(f"Request URL: {url}")
    
    analyze_request = {
        'comment': {'text': text},
        'requestedAttributes': {
            'TOXICITY': {},
            'SEVERE_TOXICITY': {},
            'IDENTITY_ATTACK': {},
            'INSULT': {},
            'PROFANITY': {},
            'THREAT': {}
        },
        'languages': ['en'],
        'doNotStore': True
    }
    
    logger.info(f"Request payload: {json.dumps(analyze_request, indent=2)}")
    
    try:
        logger.info("Sending request to Perspective API...")
        response = requests.post(
            url=url, 
            data=json.dumps(analyze_request),
            headers={'Content-Type': 'application/json'}
        )
        
        logger.info(f"Response status code: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Error response: {response.text}")
            return False
            
        response_data = response.json()
        logger.info(f"Response data: {json.dumps(response_data, indent=2)}")
        
        # Check attribute scores
        for attr in analyze_request['requestedAttributes']:
            if attr in response_data.get('attributeScores', {}):
                score = response_data['attributeScores'][attr]['summaryScore']['value']
                logger.info(f"{attr} score: {score}")
        
        logger.info("API test successful!")
        return True
        
    except Exception as e:
        logger.exception(f"Error using Perspective API: {str(e)}")
        return False

def test_content_moderation_service():
    """
    Test the content moderation service in the Django application context
    """
    logger.info("Testing ContentModerationService in Django context")
    
    try:
        # Set up Django environment
        import django
        import os
        
        # Add the project directory to the Python path
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        # Set the Django settings module
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uni_central.settings')
        
        # Initialize Django
        django.setup()
        
        # Import the service
        from uni_central.services import ContentModerationService
        
        # Log the environment variable
        api_key_env = os.environ.get('PERSPECTIVE_API_KEY', '')
        logger.info(f"PERSPECTIVE_API_KEY from env: {'SET' if api_key_env else 'NOT SET'}")
        
        # Get API key from Django settings
        from django.conf import settings
        api_key_settings = getattr(settings, 'PERSPECTIVE_API_KEY', '')
        logger.info(f"PERSPECTIVE_API_KEY from settings: {'SET' if api_key_settings else 'NOT SET'}")
        
        # Test the service
        clean_text = "This is a clean text without any inappropriate content."
        profane_text = "This contains profanity like fuck and shit which should be detected."
        
        # Test clean text
        logger.info("\nTesting clean text:")
        is_appropriate, message = ContentModerationService.moderate_text(clean_text)
        logger.info(f"Clean text - is_appropriate: {is_appropriate}, message: {message}")
        
        # Test profane text
        logger.info("\nTesting profane text:")
        is_appropriate, message = ContentModerationService.moderate_text(profane_text)
        logger.info(f"Profane text - is_appropriate: {is_appropriate}, message: {message}")
        
        return True
        
    except Exception as e:
        logger.exception(f"Error testing ContentModerationService: {str(e)}")
        return False

if __name__ == "__main__":
    # First check environment variable
    api_key = os.environ.get('PERSPECTIVE_API_KEY', '')
    logger.info(f"PERSPECTIVE_API_KEY from environment: {'SET' if api_key else 'NOT SET'}")
    
    # Prioritize command line argument if provided
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
        logger.info("Using API key from command line argument")
    
    # Test direct API access
    api_working = test_perspective_api(api_key)
    
    # Test service integration
    if api_working:
        logger.info("\n--- Testing the Django service integration ---")
        test_content_moderation_service()
    else:
        logger.warning("Skipping service integration test since direct API test failed")