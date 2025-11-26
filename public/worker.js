
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local model checks
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
class PipelineSingleton {
    static task = 'summarization';
    static model = 'Xenova/distilbart-cnn-6-6';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // Retrieve the summarization pipeline. When called for the first time,
    // this will load the pipeline and save it for future use.
    let summarizer = await PipelineSingleton.getInstance(x => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        self.postMessage(x);
    });

    // Actually perform the summarization
    let output = await summarizer(event.data.text, {
        max_length: event.data.max_length,
        min_length: event.data.min_length,
    });

    // Tokenize input to visualize
    let input_tensor = summarizer.tokenizer(event.data.text);
    let input_tokens = [];
    for (let i = 0; i < input_tensor.input_ids.data.length; ++i) {
        input_tokens.push(summarizer.tokenizer.decode([input_tensor.input_ids.data[i]]));
    }

    // Tokenize output to visualize
    let output_tensor = summarizer.tokenizer(output[0].summary_text);
    let output_tokens = [];
    for (let i = 0; i < output_tensor.input_ids.data.length; ++i) {
        output_tokens.push(summarizer.tokenizer.decode([output_tensor.input_ids.data[i]]));
    }

    // Send the result back to the main thread
    self.postMessage({
        status: 'complete',
        output: output,
        input_tokens: input_tokens,
        output_tokens: output_tokens,
    });
});
