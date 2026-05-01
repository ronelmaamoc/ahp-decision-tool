import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services.ahp_engine import AHPEngine

@csrf_exempt
@require_http_methods(["POST"])
def compute_ahp(request):
    try:
        data = json.loads(request.body)
        criteria   = data.get('criteria', [])
        alternatives = data.get('alternatives', [])
        pairwise   = data.get('pairwise_matrix', [])

        if len(criteria) < 2:
            return JsonResponse({'error': 'At least 2 criteria required.'}, status=400)
        if len(alternatives) < 2:
            return JsonResponse({'error': 'At least 2 alternatives required.'}, status=400)

        engine = AHPEngine(criteria, alternatives, pairwise)
        result = engine.run()
        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)