import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.translation import translator_service, Translator


@pytest.mark.asyncio
async def test_translate_endpoint(async_client, sho_headers):
    """Test POST /translate/ API endpoint uses non-blocking async translation."""
    payload = {
        "text": "FIR at Police Station regarding Theft",
        "target_lang": "hi",
        "source_lang": "en"
    }
    response = await async_client.post("/translate/", json=payload, headers=sho_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["original"] == payload["text"]
    assert "Prathamik Suchna Report" in data["translated"]
    assert "Police Thana" in data["translated"]
    assert "Chori" in data["translated"]


@pytest.mark.asyncio
async def test_translator_service_async_translate():
    """Test Translator.translate async method directly."""
    result = await translator_service.translate("FIR", "hi", "en")
    assert result == "Prathamik Suchna Report"


@pytest.mark.asyncio
async def test_translator_service_llamacpp_async_mock():
    """Test _apply_llamacpp_translation non-blocking async execution using httpx.AsyncClient mock."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "Anuvaadit Path"}}]
    }

    translator = Translator()
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await translator._apply_llamacpp_translation("Test text", "en", "hi")
        assert res == "Anuvaadit Path"
        assert mock_post.called


def test_translator_service_translate_sync():
    """Test Translator.translate_sync for synchronous callers."""
    translator = Translator()
    res = translator.translate_sync("Accident", "hi", "en")
    assert res == "Durghatna"
