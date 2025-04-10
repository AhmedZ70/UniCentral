#!/usr/bin/env python3
import os
import json
import requests
import sys

def test_perspective_api():
    """Test the Perspective API connection and configuration"""
    print("Testing Perspective API connection...")
    
    # 1. Check for API key
    api_key = os.environ.get('PERSPECTIVE_API_KEY')
    if not api_key:
        print("ERROR: PERSPECTIVE_API_KEY environment variable is not set")
        print("Set it with: export PERSPECTIVE_API_KEY='your-api-key'")
        return False
    
    # 2. Test API connection with a sample text
    url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={api_key}"
    
    # Test with a neutral text first
    neutral_text = "This is a test message for the Perspective API."
    analyze_request = {
        'comment': {'text': neutral_text},
        'requestedAttributes': {
            'TOXICITY': {},
            'PROFANITY': {},
        },
        'languages': ['en'],
        'doNotStore': True
    }
    
    try:
        print("Testing API with neutral text...")
        response = requests.post(
            url=url, 
            data=json.dumps(analyze_request),
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"ERROR: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print("Success! API responded with:")
        print(f"TOXICITY score: {data['attributeScores']['TOXICITY']['summaryScore']['value']}")
        print(f"PROFANITY score: {data['attributeScores']['PROFANITY']['summaryScore']['value']}")
        
        # Now test with profanity text to confirm moderation works
        profanity_text = "This test is shit and it's a fucking mess"
        analyze_request['comment']['text'] = profanity_text
        
        print("\nTesting API with profanity text...")
        response = requests.post(
            url=url, 
            data=json.dumps(analyze_request),
            headers={'Content-Type': 'application/json'}
        )
        
        data = response.json()
        toxicity = data['attributeScores']['TOXICITY']['summaryScore']['value']
        profanity = data['attributeScores']['PROFANITY']['summaryScore']['value']
        
        print(f"TOXICITY score: {toxicity}")
        print(f"PROFANITY score: {profanity}")
        
        if profanity > 0.8:
            print("Success! Profanity detection is working correctly.")
        else:
            print("WARNING: Profanity score is lower than expected.")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Connection error - {str(e)}")
        return False
    except KeyError as e:
        print(f"ERROR: Unexpected API response format - {str(e)}")
        print(f"Full response: {json.dumps(data, indent=2)}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error - {str(e)}")
        return False

if __name__ == "__main__":
    success = test_perspective_api()
    if not success:
        sys.exit(1)