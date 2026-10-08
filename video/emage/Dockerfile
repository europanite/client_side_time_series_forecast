FROM python:3.11-slim
RUN pip install --no-cache-dir numpy==1.26.4
WORKDIR /adapter
COPY convert_npz.py ./convert_npz.py
ENTRYPOINT ["python", "convert_npz.py"]
